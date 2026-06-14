// src/App.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG FROM THE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STAPLES = [
  { name: '🥛 Milk', category: 'Dairy' },
  { name: '🥚 Eggs', category: 'Dairy' },
  { name: '🍞 Bread', category: 'Bakery' },
  { name: '🧅 Onions', category: 'Produce' },
  { name: '☕ Coffee', category: 'Pantry' }
];

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [quantity, setQuantity] = useState('');
  const [user, setUser] = useState(localStorage.getItem('family_member') || 'Me');

  // Listen to Firestore database in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groceries'), (snapshot) => {
      const groceryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(groceryList);
    });
    return () => unsubscribe();
  }, []);

  // Save family member name locally
  const handleUserChange = (e) => {
    setUser(e.target.value);
    localStorage.setItem('family_member', e.target.value);
  };

  // Add item to global Firestore list
  const addItem = async (e, customItem = null) => {
    if (e) e.preventDefault();
    
    const itemToAdd = customItem ? customItem.name : newItem;
    const itemCategory = customItem ? customItem.category : category;
    
    if (!itemToAdd.trim()) return;

    await addDoc(collection(db, 'groceries'), {
      name: itemToAdd,
      category: itemCategory,
      quantity: customItem ? '1 Pack' : quantity || '1',
      status: 'Needed',
      addedBy: user,
      createdAt: new Date()
    });

    if (!customItem) {
      setNewItem('');
      setQuantity('');
    }
  };

  // Toggle item status between Needed and In Cart
  const toggleStatus = async (id, currentStatus) => {
    const itemRef = doc(db, 'groceries', id);
    await updateDoc(itemRef, {
      status: currentStatus === 'Needed' ? 'In Cart' : 'Needed'
    });
  };

  // Delete item completely
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'groceries', id));
  };

  const neededItems = items.filter(item => item.status === 'Needed');
  const cartItems = items.filter(item => item.status === 'In Cart');

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-lg min-h-screen flex flex-col font-sans">
        
        {/* Header */}
        <header className="bg-emerald-600 p-4 text-white flex justify-between items-center shadow-md">
          <h1 className="text-xl font-bold flex items-center gap-2">🏡 Our Home Pantry</h1>
          <select 
            value={user} 
            onChange={handleUserChange}
            className="bg-emerald-700 text-white font-medium py-1 px-3 rounded-full text-sm outline-none border border-emerald-500"
          >
            <option value="Dad">Dad 🧔</option>
            <option value="Mom">Mom 👩</option>
            <option value="Kid 1">Kid 1 🧒</option>
            <option value="Kid 2">Kid 2 👧</option>
          </select>
        </header>

        {/* Form to Add New Item */}
        <form onSubmit={addItem} className="p-4 bg-gray-100 border-b border-gray-200 grid grid-cols-12 gap-2">
          <input 
            type="text" 
            placeholder="What do we need?" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="col-span-6 p-2 rounded border border-gray-300 text-sm outline-none focus:border-emerald-500"
          />
          <input 
            type="text" 
            placeholder="Qty" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="col-span-2 p-2 rounded border border-gray-300 text-sm text-center outline-none focus:border-emerald-500"
          />
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="col-span-3 p-2 rounded border border-gray-300 text-xs outline-none bg-white"
          >
            <option value="Pantry">Pantry</option>
            <option value="Dairy">Dairy</option>
            <option value="Produce">Produce</option>
            <option value="Bakery">Bakery</option>
            <option value="Household">Household</option>
          </select>
          <button type="submit" className="col-span-1 bg-emerald-600 text-white font-bold rounded flex items-center justify-center hover:bg-emerald-700">+</button>
        </form>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Staples Section */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">📋 Quick Staples (Tap to add)</h2>
            <div className="flex flex-wrap gap-2">
              {STAPLES.map((staple, index) => (
                <button 
                  key={index} 
                  onClick={() => addItem(null, staple)}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-emerald-50 shadow-sm transition flex items-center gap-1"
                >
                  ➕ {staple.name}
                </button>
              ))}
            </div>
          </div>

          {/* Need To Buy List */}
          <div>
            <h2 className="text-xs font-semibold text-amber-600 tracking-wider uppercase mb-2 flex items-center gap-1">
              🛒 Need to Buy ({neededItems.length})
            </h2>
            {neededItems.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-2">Pantry is fully stocked!</p>
            ) : (
              <div className="space-y-2">
                {neededItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={() => toggleStatus(item.id, item.status)}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name} <span className="text-xs font-normal text-gray-500">({item.quantity})</span></p>
                        <p className="text-2xs text-gray-400">Added by {item.addedBy}</p>
                      </div>
                    </div>
                    <span className="text-2xs font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-600 uppercase tracking-wide">{item.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Already In Cart List */}
          {cartItems.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">
                ✓ Already In Cart ({cartItems.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={true} 
                        onChange={() => toggleStatus(item.id, item.status)}
                        className="w-5 h-5 rounded text-emerald-600 border-gray-300 cursor-pointer"
                      />
                      <p className="line-through text-sm font-medium text-gray-500">{item.name}</p>
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 text-sm font-bold px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;