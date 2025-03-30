import React from 'react';
import ReactDOM from 'react-dom/client';
import { config } from './config.js';

const { useState, useEffect, useSyncExternalStore } = React;

// Initialize WebsimSocket
const room = new WebsimSocket();

function App() {
    const [newItemText, setNewItemText] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [creatorUsername, setCreatorUsername] = useState('');

    // Fetch creator username and check if the current user is the creator
    useEffect(() => {
        async function checkCreator() {
            try {
                const creator = await window.websim.getCreatedBy();
                const currentUser = await room.getMyInfo(); // Assuming getMyInfo() provides current user info
                setCreatorUsername(creator.username);
                if (currentUser && creator && currentUser.username === creator.username) {
                    setIsCreator(true);
                }
            } catch (error) {
                console.error("Error checking creator:", error);
            }
        }
        checkCreator();
    }, []);

    // Subscribe to list items
    const items = useSyncExternalStore(
        room.collection(config.collectionName).subscribe,
        room.collection(config.collectionName).getList
    ) || []; // Default to empty array if getList returns null initially


    const handleAddItem = async () => {
        if (!newItemText.trim()) return; // Don't add empty items
        if (!isCreator) {
            console.log("Only the creator can add items.");
            return; // Only allow creator to add items
        }
        try {
            await room.collection(config.collectionName).create({ text: newItemText });
            setNewItemText(''); // Clear input field after adding
        } catch (error) {
            console.error("Error adding item:", error);
        }
    };

    const handleDeleteItem = async (itemId) => {
         if (!isCreator) {
            console.log("Only the creator can delete items.");
            return; // Only allow creator to delete items
        }
        try {
            await room.collection(config.collectionName).delete(itemId);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

     // Sort items by creation date (oldest first)
     const sortedItems = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
        <div>
            <h1>{config.listTitle} {creatorUsername ? `(by ${creatorUsername})` : ''}</h1>
            <ul>
                {sortedItems.map(item => (
                    <li key={item.id}>
                        <span>{item.text}</span>
                        {isCreator && (
                            <button className="delete-button" onClick={() => handleDeleteItem(item.id)}>
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {isCreator && (
                <div className="add-item-container">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new item"
                    />
                    <button className="add-button" onClick={handleAddItem}>Add</button>
                </div>
            )}
             {!isCreator && <p>Only the creator ({creatorUsername}) can edit this list.</p>}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

