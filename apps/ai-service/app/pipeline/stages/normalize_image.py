def run_normalize_image(context: dict) -> dict:
    context["stages"].append("normalize_image")
    return context