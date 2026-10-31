"""Generate Mermaid C4 blocks from the same graph used by the PDF renderer."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
START = "<!-- BEGIN GENERATED C4 -->"
END = "<!-- END GENERATED C4 -->"


def load_views():
    """Validate graph endpoints before either renderer uses the architecture."""
    document = json.loads((ROOT / "architecture.json").read_text())
    views = document["views"]
    if [view["level"] for view in views] != [1, 2, 3]:
        raise ValueError("Expected C4 levels 1, 2 and 3")
    for view in views:
        node_ids = [node["id"] for node in view["nodes"]]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError(f"Duplicate node ID in level {view['level']}")
        edge_ids = [edge["id"] for edge in view["edges"]]
        if len(edge_ids) != len(set(edge_ids)):
            raise ValueError(f"Duplicate edge ID in level {view['level']}")
        for edge in view["edges"]:
            if edge["from"] not in node_ids or edge["to"] not in node_ids:
                raise ValueError(f"Unknown relationship endpoint: {edge}")
    return views


def quoted(text):
    return text.replace('"', "&quot;").replace("\n", "<br/>")


def render_view(view):
    lines = [
        f"## {view['title']}",
        "",
        view["description"],
        "",
        "```mermaid",
        "flowchart TB",
    ]
    boundary = view.get("boundary")
    inside = {node["id"] for node in view["nodes"] if node.get("insideBoundary")}
    for node in view["nodes"]:
        if not boundary or node["id"] not in inside:
            label = "<br/>".join(
                quoted(node[field]) for field in ("title", "kind", "description")
            )
            lines.append(f'  {node["id"]}["{label}"]')
    if boundary:
        lines.append(f'  subgraph scope["{quoted(boundary["label"])}"]')
        for node in view["nodes"]:
            if node["id"] in inside:
                label = "<br/>".join(
                    quoted(node[field]) for field in ("title", "kind", "description")
                )
                lines.append(f'    {node["id"]}["{label}"]')
        lines.append("  end")
    for edge in view["edges"]:
        arrow = (
            "-.->"
            if edge.get("future")
            else "<-->"
            if edge.get("bidirectional")
            else "-->"
        )
        label = quoted(f"{edge['id']}. {edge['label']} / {edge['technology']}")
        lines.append(f'  {edge["from"]} {arrow}|"{label}"| {edge["to"]}')
    lines.extend(["```", ""])
    return "\n".join(lines)


def update_markdown():
    path = ROOT / "architecture.md"
    before, remaining = path.read_text().split(START, 1)
    _, after = remaining.split(END, 1)
    generated = "\n\n".join(render_view(view) for view in load_views())
    path.write_text(before + START + "\n\n" + generated + "\n" + END + after)
    print(path)


if __name__ == "__main__":
    update_markdown()
