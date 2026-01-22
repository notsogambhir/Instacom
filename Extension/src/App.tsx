import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const Popup = () => {
  return (
    <div className="w-64 h-80 bg-gray-900 text-white p-4 flex flex-col items-center">
      <h2 className="text-lg font-bold mb-4">InstaCom</h2>
      <div className="grid grid-cols-2 gap-2 w-full">
        <button className="h-20 bg-gray-800 hover:bg-gray-700 rounded flex flex-col items-center justify-center border border-gray-600">
          <span className="text-2xl">👥</span>
          <span className="text-xs mt-1">Group</span>
        </button>
        <button className="h-20 bg-gray-800 hover:bg-gray-700 rounded flex flex-col items-center justify-center border border-gray-600">
          <span className="text-2xl">👤</span>
          <span className="text-xs mt-1">John</span>
        </button>
      </div>

      <div className="mt-auto w-full">
        <div className="text-xs text-center text-gray-500 mb-2">My Status</div>
        <div className="flex gap-1 justify-center">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
