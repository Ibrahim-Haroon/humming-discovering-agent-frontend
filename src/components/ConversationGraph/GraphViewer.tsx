import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    NodeChange,
    applyNodeChanges,
    XYPosition
} from 'reactflow';
import 'reactflow/dist/style.css';

type NodeState = 'INITIAL' | 'IN_PROGRESS' | 'TERMINAL';

const nodeColors: Record<NodeState, string> = {
    INITIAL: '#61e761',
    IN_PROGRESS: '#fff',
    TERMINAL: '#FF6B6B'
};

interface GraphNode {
    id: string;
    is_initial: Boolean;
    is_terminal: Boolean;
    decision_point: string;
}

interface GraphEdge {
    source: string;
    target: string;
    message: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface NodePositions {
    [key: string]: XYPosition;
}

const formatLabel = (node: GraphNode) => {
    if (node.is_initial) {
        return `'START': ${node.decision_point}`;
    }
    return `${node.decision_point}`;
};

function get_state(node: GraphNode): NodeState {
    if (node.is_initial) {
        return "INITIAL";
    }
    else if (node.is_terminal) {
        return "TERMINAL"
    }
    return "IN_PROGRESS";
}

const getRandomPosition = (): XYPosition => ({
    x: Math.random() * 500,
    y: Math.random() * 500
});

const ConversationGraphViewer = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nodePositions = useRef<NodePositions>({});
    const nodesRef = useRef<Node[]>([]);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    const fetchGraphData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:8000/v1/conversation-graph');
            if (!response.ok) throw new Error('Failed to fetch graph data');

            const data: GraphData = await response.json();
            const existingNodeIds = new Set(nodesRef.current.map(node => node.id));

            const newNodes = data.nodes.map((node: GraphNode) => {
                let position: XYPosition;

                // Check if we have a stored position for this node
                if (nodePositions.current[node.id]) {
                    position = nodePositions.current[node.id];
                } else if (existingNodeIds.has(node.id)) {
                    // If node exists in current nodes but not in positions ref,
                    // find its current position
                    const existingNode = nodesRef.current.find(n => n.id === node.id);
                    position = existingNode?.position || getRandomPosition();
                } else {
                    // This is a new node, give it a random position
                    position = getRandomPosition();
                }

                // Store the position
                nodePositions.current[node.id] = position;

                return {
                    id: node.id,
                    data: {
                        label: formatLabel(node),
                        decision_point: node.decision_point
                    },
                    position,
                    style: {
                        background: nodeColors[get_state(node)],
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #222',
                        width: 200
                    }
                };
            });

            const newEdges = data.edges.map((edge: GraphEdge, i: number) => ({
                id: `e${i}`,
                source: edge.source,
                target: edge.target,
                message: edge.message,
                animated: true,
                style: { stroke: '#222' }
            }));

            setNodes(newNodes);
            setEdges(newEdges);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Error fetching graph:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGraphData();
        const interval = setInterval(fetchGraphData, 60000); // Poll every 60 seconds
        return () => clearInterval(interval);
    }, [fetchGraphData]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes(nodes => {
            const updatedNodes = applyNodeChanges(changes, nodes);

            // Update stored positions for any nodes that moved
            changes.forEach(change => {
                if (change.type === 'position' && change.position) {
                    nodePositions.current[change.id] = change.position;
                }
            });

            return updatedNodes;
        });
    }, []);

    return (
        <div className="w-full h-screen relative">
            {isLoading && <div className="absolute top-4 right-4">Loading...</div>}
            {error && <div className="absolute top-4 right-4 text-red-500">{error}</div>}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default ConversationGraphViewer;