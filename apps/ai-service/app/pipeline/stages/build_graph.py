def run_build_graph(context: dict) -> dict:
    context["stages"].append("build_graph")
    return context