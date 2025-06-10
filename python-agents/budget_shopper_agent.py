import asyncio
import json
from agents import Agent, Runner, function_tool
from typing import Dict, List, Any
import os
from dotenv import load_dotenv
load_dotenv()

@function_tool
def hunt_for_deals_and_discounts() -> Dict[str, Any]:
    """Search for the best deals, discounts, and promotions on MercadoLivre"""
    return {
        "deals_found": [
            {
                "category": "Casa e Jardim",
                "product": "Kit Panelas Antiaderente",
                "original_price": "R$ 299",
                "discounted_price": "R$ 149",
                "discount_percentage": "50%",
                "shipping": "Grátis",
                "time_limited": "Oferta relâmpago - 2h restantes"
            },
            {
                "category": "Moda",
                "product": "Tênis Casual Unissex",
                "original_price": "R$ 159",
                "discounted_price": "R$ 89",
                "discount_percentage": "44%",
                "shipping": "R$ 12",
                "promotion": "Compre 2, leve 3"
            },
            {
                "category": "Eletrônicos",
                "product": "Fone Bluetooth",
                "original_price": "R$ 249",
                "discounted_price": "R$ 99",
                "discount_percentage": "60%",
                "shipping": "Grátis",
                "coupon_available": "Extra 10% com CUPOM10"
            }
        ],
        "deal_hunting_experience": "Great filter options for discounted items",
        "price_alerts": "Can set alerts for price drops"
    }

@function_tool
def compare_prices_and_sellers() -> Dict[str, Any]:
    """Compare prices across different sellers and analyze value propositions"""
    return {
        "price_comparison": {
            "same_product_different_sellers": {
                "seller_a": {"price": "R$ 120", "shipping": "R$ 15", "rating": 4.2, "delivery": "5-7 dias"},
                "seller_b": {"price": "R$ 135", "shipping": "Grátis", "rating": 4.8, "delivery": "2-3 dias"},
                "seller_c": {"price": "R$ 110", "shipping": "R$ 20", "rating": 3.9, "delivery": "7-10 dias"}
            },
            "best_value_analysis": "Seller B offers best overall value despite higher price",
            "factors_considered": ["Price", "Shipping cost", "Seller reputation", "Delivery speed"]
        },
        "money_saving_tips_discovered": [
            "Bundle deals save 15-25%",
            "Buying during sales events (Black Friday, Cyber Monday)",
            "Using Mercado Pago for extra discounts",
            "Free shipping minimum threshold: R$ 79"
        ],
        "payment_options_for_budget": {
            "installments": "Up to 12x sem juros",
            "pix_discount": "5% extra discount",
            "cashback": "Up to 3% back with Mercado Pago"
        }
    }

@function_tool
def evaluate_product_value() -> Dict[str, Any]:
    """Assess product value considering quality, durability, and cost-effectiveness"""
    return {
        "value_assessment": {
            "quality_indicators": [
                "User reviews mentioning durability",
                "Brand reputation for reliability",
                "Warranty terms and conditions",
                "Return policy flexibility"
            ],
            "cost_per_use_analysis": "Essential for determining true value",
            "alternatives_considered": "Always check generic/store brands"
        },
        "review_analysis": {
            "focus_on": ["Long-term usage", "Value for money", "Durability", "Customer service"],
            "red_flags": ["Too many recent negative reviews", "Fake positive reviews", "Quality degradation"],
            "helpful_reviewers": "Verified purchasers with detailed feedback"
        },
        "seasonal_shopping_strategy": {
            "best_months": ["January", "May", "November"],
            "category_cycles": {
                "electronics": "Post-holiday clearance",
                "fashion": "End-of-season sales",
                "home": "Back-to-school period"
            }
        }
    }

agent = Agent(
    name="Budget-Conscious Shopper Agent",
    instructions="""You are a careful, budget-conscious shopper exploring MercadoLivre with a focus on 
    getting the best value for money. You prioritize deals, discounts, price comparisons, and overall 
    value propositions. You're experienced at finding hidden gems, comparing sellers, and making smart 
    purchasing decisions. Provide feedback on the deal-hunting experience, price transparency, and 
    money-saving features of the platform.""",
    tools=[hunt_for_deals_and_discounts, compare_prices_and_sellers, evaluate_product_value]
)

async def main():
    result = await Runner.run(agent, "Hunt for the best deals and evaluate value propositions on MercadoLivre")
    print("Budget Shopper Feedback:", result.final_output)

if __name__ == "__main__":
    asyncio.run(main()) 