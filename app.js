import { createRoot } from 'react-dom/client'; // Import createRoot directly
import { config } from './config.js';

const { useState, useEffect, useSyncExternalStore } = React; // React is globally available via script tag

// Initialize WebsimSocket
const room = new WebsimSocket();

function App() {
    const [newItemText, setNewItemText] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [creatorUsername, setCreatorUsername] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user info
    useEffect(() => {
        async function fetchUserInfo() {
            // Use room.getMyInfo() which might be async or sync depending on implementation
            // Handle potential async nature if needed
             try {
                 const userInfo = await room.getMyInfo(); // Assuming getMyInfo might be async
                 setCurrentUser(userInfo);
             } catch (error) {
                 console.error("Error fetching current user info:", error);
             }
        }
        fetchUserInfo();

        // Optional: Subscribe to changes if user info can update
        // const unsubscribe = room.subscribeUserInfo(setCurrentUser);
        // return () => unsubscribe(); // Cleanup subscription

    }, []); // Run once on mount


    // Fetch creator username and check if the current user is the creator
    useEffect(() => {
        // Ensure currentUser is loaded before checking creator status
        if (!currentUser) return;

        async function checkCreator() {
            try {
                const creator = await window.websim.getCreatedBy();
                setCreatorUsername(creator.username);
                 // Compare usernames ensuring both currentUser and creator objects are valid
                if (creator && currentUser.username === creator.username) {
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
    }, [currentUser]); // Rerun checkCreator when currentUser is updated

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
             // Check if error is due to permissions (e.g., trying to delete another user's item)
            if (error.message && error.message.includes("Permission denied")) {
                 alert("Permission denied: You can only delete items you created.");
             } else {
                 alert("Failed to delete item. See console for details.");
             }
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
                        {/* Show delete button only if the current user is the creator */}
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
             {/* Show message if not creator */}
             {!isCreator && creatorUsername && <p>Only the creator ({creatorUsername}) can add or delete items in this list.</p>}
             {/* Message while loading creator info */}
             {!creatorUsername && <p>Loading list information...</p>}

        </div>
    );
}

// Use the imported createRoot function
const root = createRoot(document.getElementById('root'));
root.render(<App />);