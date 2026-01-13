import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

function PlayersPageComponent() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/admin/players', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_jwt')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch players');
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanPlayer = async (player) => {
    try {
      const res = await fetch(`/admin/players/${player.login}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_jwt')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Banned via admin panel' }),
      });
      if (!res.ok) throw new Error('Failed to ban player');
      await fetchPlayers();
      setShowBanModal(false);
      setBanTarget(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnbanPlayer = async (player) => {
    try {
      const res = await fetch(`/admin/players/${player.login}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_jwt')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Unbanned via admin panel' }),
      });
      if (!res.ok) throw new Error('Failed to unban player');
      await fetchPlayers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Player Management</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Twitch Linked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.login}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {player.login}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.display_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      player.twitch_id ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {player.twitch_id ? 'Linked' : 'Not Linked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      player.role === 'banned' ? 'bg-red-100 text-red-800' :
                      player.role === 'player' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {player.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sm font-medium">
                    <div className="flex space-x-2">
                      {player.role === 'banned' ? (
                        <button
                          onClick={() => handleUnbanPlayer(player)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setBanTarget(player);
                            setShowBanModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanModal && banTarget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Confirm {banTarget.role === 'banned' ? 'Unban' : 'Ban'}</h2>
              <p className="mb-4">
                Are you sure you want to {banTarget.role === 'banned' ? 'unban' : 'ban'} <strong>{banTarget.login}</strong>?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (banTarget.role === 'banned') {
                      handleUnbanPlayer(banTarget);
                    } else {
                      handleBanPlayer(banTarget);
                    }
                  }}
                  className={`px-4 py-2 text-white rounded hover:opacity-90 ${
                    banTarget.role === 'banned' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {banTarget.role === 'banned' ? 'Unban Player' : 'Ban Player'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <ErrorBoundary>
      <PlayersPageComponent />
    </ErrorBoundary>
  );
}
