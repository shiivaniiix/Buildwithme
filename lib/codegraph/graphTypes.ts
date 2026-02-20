export interface CodeGraph {
  projectId: string;
  generatedAt: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  technologies: DetectedTechnology[];
}

export interface GraphNode {
  id: string;
  type: "file" | "folder";
  name: string;
  path: string;
  language?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "contains";
}

export interface DetectedTechnology {
  name: string;
  category: "language" | "framework" | "runtime" | "tooling";
}


