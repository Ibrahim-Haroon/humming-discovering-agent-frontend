import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    NodeChange,
    applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

type NodeState = 'INITIAL' | 'IN_PROGRESS' | 'TERMINAL';

const nodeColors: Record<NodeState, string> = {
    INITIAL: '#e0f2e0',
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

const formatLabel = (node: GraphNode) => {
    if (node.is_initial) {
        return `{'START')}: ${node.decision_point}`;
    }
    else if (node.is_terminal) {
        return `{'TERMINAL')}: ${node.decision_point}`;
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

const ConversationGraphViewer = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGraphData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:8000/v1/conversation-graph');
            if (!response.ok) throw new Error('Failed to fetch graph data');

            const data: GraphData = await response.json();

            const newNodes = data.nodes.map((node: GraphNode) => ({
                id: node.id,
                data: {
                    label: formatLabel(node),
                    decision_point: node.decision_point
                },
                position: { x: Math.random() * 500, y: Math.random() * 500 },
                style: {
                    background: nodeColors[get_state(node)],
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #222',
                    width: 200
                }
            }));

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
        const interval = setInterval(fetchGraphData, 60000);
        return () => clearInterval(interval);
    }, [fetchGraphData]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes(nodes => applyNodeChanges(changes, nodes)),
        []
    );

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