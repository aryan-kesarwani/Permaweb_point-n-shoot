import { useState, useEffect } from 'react';
import { dryrun } from '@permaweb/aoconnect';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  timestamp: string;
  tags: { name: string; value: string }[];
  status: string;
  data: string;
}

const PROCESS_ID = 'Ne07gWE81_3_kotEkD0W_JydNEEPqkIWgWsq7fFU69g';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    if (window.arweaveWallet) {
      window.arweaveWallet.connect(['ACCESS_ADDRESS']).then(() => {
        setWalletConnected(true);
      }).catch(() => {
        setWalletConnected(false);
      });
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const connectWallet = async () => {
    try {
      if (!window.arweaveWallet) {
        throw new Error('Arweave wallet not found');
      }
      await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
      setWalletConnected(true);
      fetchTransactions(); // Fetch transactions after wallet connection
    } catch (err) {
      setError('Failed to connect wallet. Please install ArConnect');
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    if (!walletConnected) {
      return; // Don't fetch if wallet isn't connected
    }

    try {
      setLoading(true);
      setError('');
      const result = await dryrun({
        process: PROCESS_ID,
        tags: [{ name: 'Action', value: 'GetTransactions' }]
      });

      console.log('Dryrun Result:', result); // Debugging the response

      if (result.Messages?.[0]?.Data) {
        const txData = JSON.parse(result.Messages[0].Data);
        console.log('Parsed Transactions:', txData); // Debugging parsed transactions
        setTransactions(txData.map((tx: any) => ({
          ...tx,
          tags: tx.tags.map((tag: any) => ({
            name: tag.name || 'Unknown',
            value: tag.value || 'Unknown'
          }))
        })));
      } else {
        console.log('No transaction data found in result.Messages[0].Data');
        setTransactions([]);
      }
    } catch (err) {
      setError('Failed to fetch transactions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.tags.some(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof Transaction];
    const bValue = b[sortConfig.key as keyof Transaction];
    return sortConfig.direction === 'asc' ? 
      String(aValue).localeCompare(String(bValue)) :
      String(bValue).localeCompare(String(aValue));
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportTransactions = () => {
    const csv = transactions.map(tx => {
      const tagString = tx.tags.map(t => `${t.name}:${t.value}`).join(';');
      return `${tx.id},${tx.timestamp},${tagString},${tx.status}`;
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">AO Transaction Manager</h1>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={connectWallet}
            className={`px-4 py-2 rounded-lg ${walletConnected ? 'bg-green-500' : 'bg-blue-500'} text-white`}
          >
            {walletConnected ? '✓ Connected' : 'Connect Wallet'}
          </motion.button>
        </div>
      </nav>

      {!walletConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500 text-white p-4 rounded-lg mb-4"
        >
          Please connect your wallet to view transactions
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 text-white p-4 rounded-lg mb-4"
        >
          {error}
        </motion.div>
      )}

      {walletConnected && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <input
              type="text"
              placeholder="Search transactions..."
              className="p-2 rounded-lg border w-64 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportTransactions}
              className="px-4 py-2 rounded-lg bg-green-500 text-white"
              disabled={transactions.length === 0}
            >
              Export CSV
            </motion.button>
          </div>

          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
            />
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('id')}>ID</th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('timestamp')}>Timestamp</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map(tx => (
                    <motion.tr
                      key={tx.id}
                      whileHover={{ backgroundColor: darkMode ? '#374151' : '#f3f4f6' }}
                      onClick={() => setSelectedTx(tx)}
                      className="cursor-pointer border-t"
                    >
                      <td className="p-3">{tx.id.slice(0, 8)}...</td>
                      <td className="p-3">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {tx.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-full bg-blue-500 text-white text-sm"
                              title={`${tag.name}: ${tag.value}`}
                            >
                              {tag.name === 'Content-Type' ? '📄' :
                               tag.name === 'Device' ? '📱' :
                               tag.name === 'Public-Id' ? '🆔' : '🏷️'} {tag.value.slice(0, 15)}
                              {tag.value.length > 15 && '...'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full ${tx.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                          {tx.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold">ID</h3>
                  <p className="font-mono break-all">{selectedTx.id}</p>
                </div>
                <div>
                  <h3 className="font-bold">Timestamp</h3>
                  <p>{new Date(selectedTx.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-bold">Tags</h3>
                  <div className="space-y-2">
                    {selectedTx.tags.map((tag, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="font-bold">{tag.name}:</span>
                        <span className="break-all">{tag.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold">Data</h3>
                  <pre className="whitespace-pre-wrap font-mono text-sm break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {selectedTx.data}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
