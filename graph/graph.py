"""
LangGraph workflow for food optimization.

Nodes:
  1. parse_input      – validate and structure user input
  2. estimate_protein – use the protein estimation tool for each food item
  3. optimize         – enumerate valid combinations within budget, rank by protein
  4. recommend        – LLM generates a human-friendly recommendation
"""

from __future__ import annotations

from itertools import combinations
from pathlib import Path
import re
from typing import Any, TypedDict

import joblib
import pandas as pd
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

load_dotenv()

# ── Protein prediction model ───────────────────────────────────────────────
MODEL_PATH = Path(__file__).resolve().parents[1] / "protein_predictor.joblib"
_protein_model: Any | None = None


def predict_protein(menu: list[FoodItem]) -> list[float]:
    """Predict protein grams using the model's food and price features."""
    global _protein_model
    if _protein_model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Protein model not found at {MODEL_PATH}")
        _protein_model = joblib.load(MODEL_PATH)

    features = pd.DataFrame([
        {
            "food_name": item["name"],
            "category": item.get("category", "unknown"),
            "price_inr": item["price"],
            "serving_size_g": item.get("serving_size_g", 100.0),
        }
        for item in menu
    ])
    return [float(value) for value in _protein_model.predict(features)]


def load_protein_model() -> None:
    """Load the model before the first request rather than during optimization."""
    global _protein_model
    if _protein_model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Protein model not found at {MODEL_PATH}")
        _protein_model = joblib.load(MODEL_PATH)


# ── State Schema ────────────────────────────────────────────────────────────
class FoodItem(TypedDict):
    name: str
    price: float


class Combination(TypedDict):
    items: list[str]
    total_cost: float
    total_protein: float


class GraphState(TypedDict):
    menu: list[FoodItem]
    budget: float
    protein_target: float
    dietary_preference: str
    protein_estimates: dict[str, float]
    valid_combinations: list[Combination]
    best_combination: Combination | None
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


def is_non_vegetarian(item: FoodItem) -> bool:
    """Identify common non-vegetarian ingredients from a menu item name."""
    return bool(NON_VEGETARIAN_FOOD_PATTERN.search(item["name"]))


# ── Node 1: Parse Input ─────────────────────────────────────────────────────
def parse_input(state: GraphState) -> dict[str, Any]:
    """Validate and pass through user input."""
    menu = state["menu"]
    budget = state["budget"]
    protein_target = state["protein_target"]

    if not menu:
        raise ValueError("Menu cannot be empty.")
    if budget <= 0:
        raise ValueError("Budget must be positive.")
    if protein_target <= 0:
        raise ValueError("Protein target must be positive.")

    return {
        "menu": menu,
        "budget": budget,
        "protein_target": protein_target,
    }


# ── Node 2: Estimate Protein via Tool ───────────────────────────────────────
def estimate_protein_node(state: GraphState) -> dict[str, Any]:
    """Predict protein for each food item with the trained joblib model."""
    protein_estimates: dict[str, float] = {}
    predictions = predict_protein(state["menu"])
    for item, protein in zip(state["menu"], predictions):
        protein_estimates[item["name"]] = protein
    return {"protein_estimates": protein_estimates}


# ── Node 3: Optimize Combinations ───────────────────────────────────────────
def optimize(state: GraphState) -> dict[str, Any]:
    """Generate all valid food combinations within budget, ranked by protein."""
    menu = state["menu"]
    dietary_preference = state.get("dietary_preference", "ANY")
    budget = state["budget"]
    protein_estimates = state["protein_estimates"]

    if dietary_preference == "VEG":
        menu = [item for item in menu if not is_non_vegetarian(item)]
    elif dietary_preference == "NON-VEG":
        non_vegetarian_names = {
            item["name"] for item in menu if is_non_vegetarian(item)
        }
    else:
        non_vegetarian_names = set()

    price_map = {item["name"]: item["price"] for item in menu}
    food_names = [item["name"] for item in menu]

    valid_combos: list[Combination] = []

    for r in range(1, len(food_names) + 1):
        for combo in combinations(food_names, r):
            if dietary_preference == "NON-VEG" and not non_vegetarian_names.intersection(combo):
                continue
            total_cost = sum(price_map[name] for name in combo)
            total_protein = sum(protein_estimates.get(name, 0) for name in combo)
            if total_cost <= budget:
                valid_combos.append({
                    "items": list(combo),
                    "total_cost": total_cost,
                    "total_protein": total_protein,
                })

    valid_combos.sort(key=lambda c: (-c["total_protein"], c["total_cost"]))
    top_combos = valid_combos[:10]
    best = top_combos[0] if top_combos else None

    return {
        "valid_combinations": top_combos,
        "best_combination": best,
    }


# ── Node 4: Build final recommendation ──────────────────────────────────────
def recommend(state: GraphState) -> dict[str, Any]:
    """Build an immediate prose recommendation from the model output."""
    budget = state["budget"]
    protein_target = state["protein_target"]
    dietary_preference = state.get("dietary_preference", "ANY")
    valid_combinations = state["valid_combinations"]
    best = state["best_combination"]

    if not best:
        if dietary_preference in {"VEG", "NON-VEG"}:
            preference_text = "vegetarian" if dietary_preference == "VEG" else "non-vegetarian"
            reason = f"combination matching your {preference_text} preference"
        else:
            reason = "combination"
        return {
            "recommendation": (
                f"I looked through your menu, but there is no {reason} within your budget of ₹{budget:.0f}. "
                f"Try increasing your budget or lowering the protein target of {protein_target:.0f}g so I can find a suitable option."
            )
        }

    total_cost = best["total_cost"]
    total_protein = best["total_protein"]
    best_items = best["items"]
    if len(best_items) == 1:
        items_text = best_items[0]
    elif len(best_items) == 2:
        items_text = f"{best_items[0]} and {best_items[1]}"
    else:
        items_text = ", ".join(best_items[:-1]) + f", and {best_items[-1]}"

    protein_difference = total_protein - protein_target
    budget_left = budget - total_cost
    goal_text = (
        f"That meets your protein target by {protein_difference:.1f}g."
        if protein_difference >= 0
        else f"That leaves you {abs(protein_difference):.1f}g short of your protein target."
    )

    recommendation = (
        "I looked through your menu and found the best combination for your goal.\n\n"
        f"Your best option is {items_text}. Together, that costs ₹{total_cost:.0f} and provides "
        f"{total_protein:.1f}g of predicted protein. {goal_text}\n\n"
        f"You will have ₹{budget_left:.0f} left from your budget of ₹{budget:.0f}. "
        "This is the strongest protein option available within your budget."
    )

    if len(valid_combinations) > 1:
        alternative = valid_combinations[1]
        alternative_items = " and ".join(alternative["items"])
        recommendation += (
            f" Another available choice is {alternative_items}, which costs ₹{alternative['total_cost']:.0f} "
            f"and provides {alternative['total_protein']:.1f}g of protein."
        )

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
