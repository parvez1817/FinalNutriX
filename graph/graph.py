"""
LangGraph workflow for food optimization.

Nodes:
  1. parse_input      – validate and structure user input, infer protein categories
  2. estimate_protein – run the ML model to predict exact protein values
  3. optimize         – find cheapest goal-meeting combo and maximum protein combo
  4. recommend        – format verified recommendation strictly from computed state
"""

from __future__ import annotations

from itertools import combinations
from pathlib import Path
import re
from typing import Any, Optional, TypedDict

import joblib
import pandas as pd
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

load_dotenv()


# ── Protein prediction model ───────────────────────────────────────────────
MODEL_PATH = Path(__file__).resolve().parents[1] / "protein_predictor.joblib"
_protein_model: Any | None = None
DEFAULT_SERVING_SIZE_G = 180.0


def infer_category_and_source(food_name: str) -> tuple[str, str]:
    """Infer protein source and category from name matching training rules."""
    name = food_name.lower()
    if any(k in name for k in ["chicken", "murgh"]):
        return "Chicken Dishes", "Chicken"
    if any(
        k in name
        for k in [
            "fish",
            "prawn",
            "shrimp",
            "crab",
            "surmai",
            "pomfret",
            "salmon",
        ]
    ):
        return "Seafood", "Fish/Seafood"
    if any(k in name for k in ["egg", "anda", "ande", "omelet"]):
        return "Egg Dishes", "Egg"
    if any(k in name for k in ["paneer", "cottage cheese"]):
        return "Dairy/Paneer", "Paneer"
    if any(
        k in name
        for k in [
            "rajma",
            "chana",
            "chole",
            "dal",
            "soya",
            "tofu",
            "lentil",
            "bean",
        ]
    ):
        return "Legumes/Pulses", "Plant Protein"
    if any(k in name for k in ["mutton", "lamb", "keema", "meat", "beef"]):
        return "Red Meat", "Meat"
    return "Mixed/General", "Vegetarian"


def load_protein_model() -> None:
    """Load the model prior to request handling."""
    global _protein_model
    if _protein_model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Protein model not found at {MODEL_PATH}")
        _protein_model = joblib.load(MODEL_PATH)


def predict_protein(menu: list[FoodItem]) -> list[float]:
    """Predict protein grams using the model's food and price features."""
    global _protein_model
    if _protein_model is None:
        load_protein_model()

    features = pd.DataFrame(
        [
            {
                "food_name": item["name"],
                "category": item.get(
                    "category", infer_category_and_source(item["name"])[0]
                ),
                "price_inr": item["price"],
                "serving_size_g": item.get(
                    "serving_size_g", DEFAULT_SERVING_SIZE_G
                ),
            }
            for item in menu
        ]
    )
    return [round(float(val), 1) for val in _protein_model.predict(features)]


# ── State Schema ────────────────────────────────────────────────────────────
class FoodItem(TypedDict, total=False):
    name: str
    price: float
    category: str
    protein_source: str
    serving_size_g: float
    order_link: Optional[str]


class Combination(TypedDict):
    items: list[str]
    item_details: list[dict[str, Any]]
    total_cost: float
    total_protein: float


class GraphState(TypedDict, total=False):
    menu: list[FoodItem]
    budget: float
    protein_target: float
    dietary_preference: str  # ANY | VEG | NON-VEG
    allergies: list[str]
    protein_estimates: dict[str, float]
    status: str  # GOAL_MET | TARGET_UNMET | NO_BUDGET
    cheapest_reaching: Combination | None
    best_combination: Combination | None
    valid_combinations: list[Combination]
    recommendation: str


NON_VEGETARIAN_FOOD_PATTERN = re.compile(
    r"\b(?:"
    r"anchov(?:y|ies)|bacon|beef|buffalo|chicken|chorizo|clam|crab|duck|"
    r"egg|eggs|fish|goat|ham|hilsa|keema|lamb|liver|lobster|mackerel|"
    r"meat|mussels?|non[\s-]?veg(?:etarian)?|octopus|omelet(?:te)?|"
    r"organ|oyster|pork|prawn|pepperoni|rabbit|"
    r"salami|salmon|sardine|sausage|shrimp|squid|tuna|turkey|"
    r"anda|ande|pomfret|rohu|surmai"
    r")\b",
    re.IGNORECASE,
)

ALLERGY_FOOD_ALIASES = {
    "dairy": {
        "milk",
        "buttermilk",
        "cheese",
        "butter",
        "cream",
        "paneer",
        "yogurt",
        "curd",
        "whey",
    },
    "gluten": {
        "wheat",
        "barley",
        "rye",
        "atta",
        "maida",
        "bread",
        "roti",
        "naan",
        "pasta",
    },
    "milk": {
        "dairy",
        "buttermilk",
        "cheese",
        "butter",
        "cream",
        "paneer",
        "yogurt",
        "curd",
        "whey",
    },
    "nuts": {
        "peanut",
        "groundnut",
        "almond",
        "cashew",
        "walnut",
        "pistachio",
        "hazelnut",
        "pecan",
    },
    "peanut": {"groundnut"},
    "peanuts": {"groundnut"},
    "shellfish": {
        "shrimp",
        "prawn",
        "crab",
        "lobster",
        "clam",
        "oyster",
        "mussel",
    },
    "soy": {"soya", "tofu"},
    "soya": {"soy", "tofu"},
    "tree nuts": {
        "almond",
        "cashew",
        "walnut",
        "pistachio",
        "hazelnut",
        "pecan",
    },
    "wheat": {"atta", "maida"},
}


def is_non_vegetarian(item: FoodItem) -> bool:
    return bool(NON_VEGETARIAN_FOOD_PATTERN.search(item["name"]))


def matches_allergy(item: FoodItem, allergies: list[str]) -> bool:
    name = item["name"]
    for allergy in allergies:
        term = allergy.strip().casefold()
        if not term or term in {"none", "n/a", "na"}:
            continue
        variants = {term, *ALLERGY_FOOD_ALIASES.get(term, set())}
        if term.endswith("s") and len(term) > 3:
            variants.add(term[:-1])
        elif len(term) > 3:
            variants.add(term + "s")
        if any(
            re.search(rf"(?<!\w){re.escape(variant)}(?!\w)", name, re.IGNORECASE)
            for variant in variants
        ):
            return True
    return False


# ── Node 1: Parse Input ─────────────────────────────────────────────────────
def parse_input(state: GraphState) -> dict[str, Any]:
    allergies = state.get("allergies", [])
    raw_menu = state.get("menu", [])
    menu: list[FoodItem] = []

    for item in raw_menu:
        if matches_allergy(item, allergies):
            continue
        cat, source = infer_category_and_source(item["name"])
        updated_item: FoodItem = {
            "name": item["name"],
            "price": float(item["price"]),
            "category": item.get("category", cat),
            "protein_source": item.get("protein_source", source),
            "serving_size_g": float(
                item.get("serving_size_g", DEFAULT_SERVING_SIZE_G)
            ),
            "order_link": item.get("order_link", ""),
        }
        menu.append(updated_item)

    budget = float(state["budget"])
    protein_target = float(state["protein_target"])

    if not menu:
        raise ValueError(
            "No menu items remain after applying allergen exclusions."
        )
    if budget <= 0:
        raise ValueError("Budget must be positive.")
    if protein_target <= 0:
        raise ValueError("Protein target must be positive.")

    return {"menu": menu, "budget": budget, "protein_target": protein_target}


# ── Node 2: Estimate Protein ───────────────────────────────────────────────
def estimate_protein_node(state: GraphState) -> dict[str, Any]:
    predictions = predict_protein(state["menu"])
    protein_estimates = {
        item["name"]: round(protein, 1)
        for item, protein in zip(state["menu"], predictions)
    }
    return {"protein_estimates": protein_estimates}


# ── Node 3: Optimize Combinations ───────────────────────────────────────────
def optimize(state: GraphState) -> dict[str, Any]:
    menu = state["menu"]
    dietary_pref = state.get("dietary_preference", "ANY").upper()
    budget = state["budget"]
    protein_target = state["protein_target"]
    estimates = state["protein_estimates"]

    # Filter items according to preference
    if dietary_pref == "VEG":
        eligible_items = [i for i in menu if not is_non_vegetarian(i)]
    elif dietary_pref == "NON-VEG":
        eligible_items = menu
    else:
        eligible_items = menu

    item_lookup = {item["name"]: item for item in eligible_items}
    food_names = list(item_lookup.keys())
    valid_combos: list[Combination] = []

    # Strict combinations (unique items per plate, 1 to len(items))
    for r in range(1, len(food_names) + 1):
        for combo_names in combinations(food_names, r):
            if dietary_pref == "NON-VEG" and not any(
                is_non_vegetarian(item_lookup[n]) for n in combo_names
            ):
                continue

            total_cost = round(sum(item_lookup[n]["price"] for n in combo_names), 2)
            if total_cost > budget:
                continue

            total_protein = round(
                sum(estimates.get(n, 0.0) for n in combo_names), 1
            )
            item_details = [
                {
                    "name": n,
                    "price": item_lookup[n]["price"],
                    "protein": estimates.get(n, 0.0),
                    "protein_source": item_lookup[n]["protein_source"],
                    "order_link": item_lookup[n].get("order_link", ""),
                }
                for n in combo_names
            ]

            valid_combos.append(
                {
                    "items": list(combo_names),
                    "item_details": item_details,
                    "total_cost": total_cost,
                    "total_protein": total_protein,
                }
            )

    if not valid_combos:
        return {
            "status": "NO_BUDGET",
            "cheapest_reaching": None,
            "best_combination": None,
            "valid_combinations": [],
        }

    # 1. Cheapest option meeting target: total_protein >= protein_target
    target_reaching = [
        c for c in valid_combos if c["total_protein"] >= protein_target
    ]
    if target_reaching:
        # Minimum cost first, tie-break by higher protein, then fewer items
        target_reaching.sort(
            key=lambda c: (c["total_cost"], -c["total_protein"], len(c["items"]))
        )
        cheapest_reaching = target_reaching[0]
        status = "GOAL_MET"
    else:
        cheapest_reaching = None
        status = "TARGET_UNMET"

    # 2. Maximum protein combination within budget
    valid_combos.sort(
        key=lambda c: (-c["total_protein"], c["total_cost"], len(c["items"]))
    )
    best_combination = valid_combos[0]

    return {
        "status": status,
        "cheapest_reaching": cheapest_reaching,
        "best_combination": best_combination,
        "valid_combinations": valid_combos[:10],
    }


# ── Node 4: Build Recommendation ───────────────────────────────────────────
def format_item_line(item: dict[str, Any]) -> str:
    link_part = f" [Order: {item['order_link']}]" if item.get("order_link") else ""
    return (
        f"- {item['name']} (₹{item['price']:.0f}, {item['protein']:.1f}g protein) "
        f"— Source: {item.get('protein_source', 'Standard')}{link_part}"
    )


def recommend(state: GraphState) -> dict[str, Any]:
    """Generate final response deterministically from state without halluncinations."""
    status = state.get("status", "NO_BUDGET")
    budget = state["budget"]
    protein_target = state["protein_target"]
    best_combo = state.get("best_combination")
    cheapest = state.get("cheapest_reaching")

    if status == "NO_BUDGET" or not best_combo:
        return {
            "recommendation": (
                f"Status: NO_COMBINATION_WITHIN_BUDGET\n"
                f"No items or combinations were found within your budget of ₹{budget:.0f}. "
                f"Try increasing your budget or reviewing menu constraints."
            )
        }

    # Primary recommendation is the cheapest option meeting the goal
    chosen = cheapest if (status == "GOAL_MET" and cheapest) else best_combo
    chosen_items_text = "\n".join(format_item_line(i) for i in chosen["item_details"])
    left_in_budget = budget - chosen["total_cost"]

    lines = [
        f"**Status**: {status}",
        f"**Chosen Option** (Recommended):",
        chosen_items_text,
        f"- **Total Cost**: ₹{chosen['total_cost']:.0f}",
        f"- **Predicted Protein**: {chosen['total_protein']:.1f}g (Target: {protein_target:.0f}g)",
        f"- **Left in Budget**: ₹{left_in_budget:.0f}",
    ]

    # Show highest protein alternative if different from the primary choice
    if status == "GOAL_MET" and best_combo and best_combo["items"] != chosen["items"]:
        lines.append("\n**Alternative (Maximum Protein within Budget)**:")
        alt_items_text = "\n".join(
            format_item_line(i) for i in best_combo["item_details"]
        )
        lines.append(alt_items_text)
        lines.append(
            f"- Cost: ₹{best_combo['total_cost']:.0f} | Protein: {best_combo['total_protein']:.1f}g | Left in Budget: ₹{budget - best_combo['total_cost']:.0f}"
        )

    recommendation = "\n".join(lines)
    return {"recommendation": recommendation}


# ── Build the Graph ─────────────────────────────────────────────────────────
def build_graph():
    """Build and compile the LangGraph workflow."""
    load_protein_model()
    workflow = StateGraph(GraphState)

    workflow.add_node("parse_input", parse_input)
    workflow.add_node("estimate_protein", estimate_protein_node)
    workflow.add_node("optimize", optimize)
    workflow.add_node("recommend", recommend)

    workflow.set_entry_point("parse_input")
    workflow.add_edge("parse_input", "estimate_protein")
    workflow.add_edge("estimate_protein", "optimize")
    workflow.add_edge("optimize", "recommend")
    workflow.add_edge("recommend", END)

    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)