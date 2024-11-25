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

type NodeState = 'INITIAL' | 'IN_PROGRESS' | 'TERMINAL_SUCCESS' |
    'TERMINAL_FALLBACK' | 'TERMINAL_TRANSFER' | 'ERROR';

const nodeColors: Record<NodeState, string> = {
    INITIAL: '#e0f2e0',
    IN_PROGRESS: '#fff',
    TERMINAL_SUCCESS: '#90EE90',
    TERMINAL_FALLBACK: '#FFB6C1',
    TERMINAL_TRANSFER: '#FFD700',
    ERROR: '#FF6B6B'
};

interface GraphNode {
    id: string;
    state: NodeState;
    prompt?: string;
}

interface GraphEdge {
    source: string;
    target: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const formatLabel = (state: string, content: string) => {
    return `${state.replace('TERMINAL_', '')}: ${content || ''}`;
};

const ConversationGraphViewer = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGraphData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:8000/api/conversation-graph');
            if (!response.ok) throw new Error('Failed to fetch graph data');

            const data: GraphData = await response.json();

            const newNodes = data.nodes.map((node: GraphNode) => ({
                id: node.id,
                data: {
                    label: formatLabel(node.state, node.prompt || ''),
                    prompt: node.prompt
                },
                position: { x: Math.random() * 500, y: Math.random() * 500 },
                style: {
                    background: nodeColors[node.state],
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