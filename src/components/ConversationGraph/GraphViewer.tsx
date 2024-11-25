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

interface NodeData {
    id: string;
    state: NodeState;
    prompt: string;
}

interface MockData {
    nodes: NodeData[];
    edges: { source: string; target: string; }[];
}

const nodeColors: Record<NodeState, string> = {
    INITIAL: '#e0f2e0',
    IN_PROGRESS: '#fff',
    TERMINAL_SUCCESS: '#90EE90',
    TERMINAL_FALLBACK: '#FFB6C1',
    TERMINAL_TRANSFER: '#FFD700',
    ERROR: '#FF6B6B'
};

const mapStateToLabel = (state: NodeState, prompt: string) => {
    const shortPrompt = prompt?.split('.')[0]?.slice(0, 30);

    switch (state) {
        case 'INITIAL':
            return 'Start';
        case 'IN_PROGRESS':
            return `In Progress: ${shortPrompt}...`;
        case 'TERMINAL_SUCCESS':
            return `Success: ${shortPrompt}...`;
        case 'TERMINAL_FALLBACK':
            return `Fallback: ${shortPrompt}...`;
        case 'TERMINAL_TRANSFER':
            return `Transfer: ${shortPrompt}...`;
        case 'ERROR':
            return `Error: ${shortPrompt}...`;
        default:
            return state;
    }
};

const ConversationGraphViewer = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const fetchGraphData = useCallback(async () => {
        const mockData: MockData = {
            nodes: [
                { id: '1', state: 'INITIAL', prompt: 'Initial contact' },
                { id: '2', state: 'IN_PROGRESS', prompt: 'AC not cooling properly' },
                { id: '3', state: 'TERMINAL_SUCCESS', prompt: 'Scheduled maintenance visit' }
            ],
            edges: [
                { source: '1', target: '2' },
                { source: '2', target: '3' }
            ]
        };

        const newNodes = mockData.nodes.map(node => ({
            id: node.id,
            data: { label: mapStateToLabel(node.state, node.prompt) },
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            style: {
                background: nodeColors[node.state],
                border: '1px solid #222',
                borderRadius: '8px',
                padding: '10px'
            }
        }));

        const newEdges = mockData.edges.map((edge, i) => ({
            id: `e${i}`,
            source: edge.source,
            target: edge.target,
            animated: true
        }));

        setNodes(newNodes);
        setEdges(newEdges);
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
        <div className="w-full h-screen">
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