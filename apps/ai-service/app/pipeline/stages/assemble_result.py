def run_assemble_result(context: dict) -> dict:
    context["stages"].append("assemble_result")
    context["result"] = {
        "status": "placeholder",
        "message": "Recognition pipeline is not implemented yet",
    }
    return context