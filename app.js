import ReactDOM from 'react-dom/client';
import { config } from './config.js';

const { useState, useEffect, useSyncExternalStore } = React; // React is globally available via script tag

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
                 // Use room.getMyInfo() to get the current user's info.
                 // Make sure to handle the case where room might not be ready or getMyInfo is async.
                 // For simplicity, assuming getMyInfo sync returns or we handle async appropriately elsewhere if needed.
                const currentUser = room.getMyInfo(); // This might need await if it's async
                setCreatorUsername(creator.username);
                 // Compare usernames ensuring both currentUser and creator objects are valid
                if (currentUser && creator && currentUser.username === creator.username) {
                    setIsCreator(true);
                } else {
                    setIsCreator(false); // Ensure isCreator is false if not the creator
                }
            } catch (error) {
                console.error("Error checking creator:", error);
                 setIsCreator(false); // Set to false on error
            }
        }
        checkCreator();
    }, []); // Empty dependency array ensures this runs once on mount

    // Subscribe to list items
    const items = useSyncExternalStore(
        room.collection(config.collectionName).subscribe,
        room.collection(config.collectionName).getList
    ) || []; // Default to empty array if getList returns null initially


    const handleAddItem = async () => {
        if (!newItemText.trim()) return; // Don't add empty items
        if (!isCreator) {
            console.log("Only the creator can add items.");
            alert("Only the creator can add items."); // Provide user feedback
            return; // Only allow creator to add items
        }
        try {
            await room.collection(config.collectionName).create({ text: newItemText });
            setNewItemText(''); // Clear input field after adding
        } catch (error) {
            console.error("Error adding item:", error);
            alert("Failed to add item. See console for details."); // Provide user feedback
        }
    };

    const handleDeleteItem = async (itemId) => {
         if (!isCreator) {
            console.log("Only the creator can delete items.");
             alert("Only the creator can delete items."); // Provide user feedback
            return; // Only allow creator to delete items
        }
        try {
            await room.collection(config.collectionName).delete(itemId);
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item. See console for details."); // Provide user feedback
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
                 {sortedItems.length === 0 && <li>No items yet.</li>}
            </ul>
            {isCreator && (
                <div className="add-item-container">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new item"
                         onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }} // Allow adding with Enter key
                    />
                    <button className="add-button" onClick={handleAddItem}>Add</button>
                </div>
            )}
             {!isCreator && items.length > 0 && <p>Only the creator ({creatorUsername}) can edit this list.</p>}
             {!isCreator && items.length === 0 && creatorUsername && <p>The list is currently empty. Only the creator ({creatorUsername}) can add items.</p>}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);