import './App.css';
import React, { useState, useEffect } from 'react';
import { Web3 } from 'web3';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import DrivingSimulation from './DrivingSimulation';

const App = () => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [status, setStatus] = useState('');
  const [userDrivingPoints, setUserDrivingPoints] = useState(0); // Changed to number
  const [showDrivingSimulation, setShowDrivingSimulation] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3.eth.getAccounts();
          const contractAddress = "0x2b29b1228890b8d77a483C62ae81D73Db4AdA32F";

          // ABI updated to use int256 for driving points
          const contractABI = [
            {
              "inputs": [],
              "stateMutability": "nonpayable",
              "type": "constructor"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "user",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "int256",
                  "name": "points",
                  "type": "int256"
                }
              ],
              "name": "DrivingPointsUpdated",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "Mint",
              "type": "event"
            },
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "from",
                  "type": "address"
                },
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "uint256",
                  "name": "value",
                  "type": "uint256"
                }
              ],
              "name": "Transfer",
              "type": "event"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "account",
                  "type": "address"
                }
              ],
              "name": "balanceOf",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "decimals",
              "outputs": [
                {
                  "internalType": "uint8",
                  "name": "",
                  "type": "uint8"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "",
                  "type": "address"
                }
              ],
              "name": "drivingPoints",
              "outputs": [
                {
                  "internalType": "int256",
                  "name": "",
                  "type": "int256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "user",
                  "type": "address"
                }
              ],
              "name": "getDrivingPoints",
              "outputs": [
                {
                  "internalType": "int256",
                  "name": "",
                  "type": "int256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "mintFromDrivingPoints",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "name",
              "outputs": [
                {
                  "internalType": "string",
                  "name": "",
                  "type": "string"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "user",
                  "type": "address"
                },
                {
                  "internalType": "int256",
                  "name": "points",
                  "type": "int256"
                }
              ],
              "name": "setDrivingPoints",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "symbol",
              "outputs": [
                {
                  "internalType": "string",
                  "name": "",
                  "type": "string"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [],
              "name": "totalSupply",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            },
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "recipient",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "transfer",
              "outputs": [
                {
                  "internalType": "bool",
                  "name": "",
                  "type": "bool"
                }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ];

          const contract = new web3.eth.Contract(contractABI, contractAddress);
          setWeb3(web3);
          setAccount(accounts[0]);
          setContract(contract);

          const balance = await contract.methods.balanceOf(accounts[0]).call();
          setBalance(web3.utils.fromWei(balance.toString(), 'ether'));

          const name = await contract.methods.name().call();
          setName(name);

          const symbol = await contract.methods.symbol().call();
          setSymbol(symbol);

          const points = await contract.methods.getDrivingPoints(accounts[0]).call();
          setUserDrivingPoints(parseInt(points)); // Always parse as int

          window.ethereum.on('accountsChanged', async (newAccounts) => {
            setAccount(newAccounts[0]);
            const newBalance = await contract.methods.balanceOf(newAccounts[0]).call();
            setBalance(web3.utils.fromWei(newBalance.toString(), 'ether'));
            const newPoints = await contract.methods.getDrivingPoints(newAccounts[0]).call();
            setUserDrivingPoints(parseInt(newPoints));
          });
        } else {
          console.error('Metamask not found');
          setStatus('Please install MetaMask to use this application.');
        }
      } catch (error) {
        console.error('Error in initialization:', error);
        setStatus('Error initializing the application: ' + error.message);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) {
      setStatus('Please enter recipient address and amount');
      return;
    }
    if (transferTo.length !== 42 || !transferTo.startsWith('0x')) {
      setStatus('Invalid Ethereum address');
      return;
    }
    try {
      setStatus('Processing transfer...');
      const amountInWei = web3.utils.toWei(transferAmount, 'ether');
      await contract.methods.transfer(transferTo, amountInWei).send({
        from: account,
        gasPrice: web3.utils.toWei('20', 'gwei'),
      });
      const newBalance = await contract.methods.balanceOf(account).call();
      setBalance(web3.utils.fromWei(newBalance.toString(), 'ether'));
      setStatus('Transfer successful!');
      setTransferTo('');
      setTransferAmount('');
    } catch (error) {
      console.error('Error in transfer:', error);
      setStatus('Transfer failed: ' + error.message);
    }
  };

  const handleMintFromPoints = async () => {
    try {
      if (userDrivingPoints < 100) {
        setStatus("You need at least 100 driving points to mint tokens");
        return;
      }
      setStatus('Minting tokens from driving points...');
      await contract.methods.mintFromDrivingPoints().send({
        from: account,
        gasPrice: web3.utils.toWei('20', 'gwei'),
      });
      const newBalance = await contract.methods.balanceOf(account).call();
      setBalance(web3.utils.fromWei(newBalance.toString(), 'ether'));
      const newPoints = await contract.methods.getDrivingPoints(account).call();
      setUserDrivingPoints(parseInt(newPoints));
      setStatus(`Successfully minted tokens!`);
    } catch (error) {
      console.error("Minting failed:", error);
      setStatus("Minting tokens failed: " + error.message);
    }
  };

  const handleDrivingPointsCalculated = async (newPoints) => {
    try {
      const currentPoints = parseInt(await contract.methods.getDrivingPoints(account).call());
      const totalPoints = currentPoints + newPoints; // Removed Math.max(0, ...)

      let statusMsg;
      if (newPoints < 0) {
        statusMsg = `Driving session completed with ${newPoints} points. Subtracting from your total...`;
      } else if (newPoints === 0) {
        statusMsg = "Driving session completed with zero points. Your total remains unchanged.";
      } else {
        statusMsg = `Driving session completed! Adding ${newPoints} points to your total...`;
      }

      setStatus(statusMsg);

      await contract.methods.setDrivingPoints(account, totalPoints).send({
        from: account,
        gasPrice: web3.utils.toWei('20', 'gwei'),
      });

      const updatedPoints = await contract.methods.getDrivingPoints(account).call();
      setUserDrivingPoints(parseInt(updatedPoints));

      setStatus(
        newPoints < 0
          ? `Subtracted ${Math.abs(newPoints)} driving points. Your total is now ${updatedPoints}.`
          : `Successfully added ${newPoints} driving points! Your total is now ${updatedPoints}.`
      );

      setShowDrivingSimulation(false);
    } catch (error) {
      console.error("Setting driving points failed:", error);
      setStatus("Failed to save driving points: " + error.message);
    }
  };

  const getStatusVariant = () => {
    if (!status) return '';
    if (status.includes('successful') || status.includes('Successfully')) return 'success';
    if (status.includes('Processing') || status.includes('Setting') || status.includes('Adding')) return 'info';
    return 'danger';
  };

  return (
    <Container className="mt-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-primary">Safe Driving Coin</h1>
          <p>Account: <strong>{account}</strong></p>
          <p>Token Balance: <strong>{balance}</strong> {symbol}</p>
          <p>Token Name: <strong>{name}</strong></p>
          <p>Token Symbol: <strong>{symbol}</strong></p>
          <p>Your Driving Points: <strong>{userDrivingPoints}</strong></p>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6}>
          <h4>Earn Driving Points</h4>
          {!showDrivingSimulation ? (
            <Button 
              variant="primary" 
              onClick={() => setShowDrivingSimulation(true)}
              className="me-2"
            >
              Start Driving Simulation
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={() => setShowDrivingSimulation(false)}
            >
              Hide Simulation
            </Button>
          )}
        </Col>
      </Row>
      {showDrivingSimulation && (
        <DrivingSimulation onPointsCalculated={handleDrivingPointsCalculated} />
      )}
      <Row className="mb-4">
        <Col md={6}>
          <h4>Mint Tokens from Driving Points</h4>
          <p>You need 100 driving points to mint 1 SDC token</p>
          <Button 
            variant="success" 
            onClick={handleMintFromPoints}
            disabled={parseInt(userDrivingPoints) < 100}
          >
            Mint Tokens
          </Button>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col md={6}>
          <h4>Transfer Tokens</h4>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Recipient Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter recipient address"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={handleTransfer}>Transfer Tokens</Button>
          </Form>
        </Col>
      </Row>
      {status && (
        <Row className="mt-4">
          <Col>
            <Alert variant={getStatusVariant()}>{status}</Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default App;