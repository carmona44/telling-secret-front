import React, { useEffect, useState }  from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

function App() {
  
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveMessage, setWaveMessage] = useState("");
  const contractAddress = "0x9eEC9a64512481cfaB856305365F0d07d1EB6c47";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      await getAllWaves();
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const finalMessage = waveMessage != "" ? waveMessage : "I've sent it w/o a message LOL";
        const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        setWaveMessage("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();
        console.table(waves);

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        }).reverse();

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
        ...prevState,
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const handleMessage = (event) => {
    setWaveMessage(event.target.value);
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          TellingSecrets
        </div>

        <div className="bio">
          ➡️ Do you want to tell something that you have never told anyone before? 😱<br></br>
          ➡️ Do you have an unpopular opinion about something? 🤯<br></br>
          ➡️ Or maybe you've lived a WTF moment 🤪<br></br><br></br>
          Anyway... take a break and get a chance to earn ETH 🤑 just for sharing it with the 🌎
        </div>

        {currentAccount && (
          <textarea 
            placeholder="What are your thoughts?..." 
            onChange={handleMessage} 
            value={waveMessage}>
          </textarea>
        )}

        {currentAccount && (
          <button className="btn" onClick={wave}>
            🔥 🔥 Let it go 🔥 🔥
          </button>
        )}

        {!currentAccount && (
          <div class="wrap">
            <button className="connectButton" onClick={connectWallet}>
              🎭 Connect Metamask
            </button>
          </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} class="waveContainer">
              <div class="waveDate">{wave.timestamp.toLocaleString()}</div>
              <div class="waveMessage">{wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );

}

export default App;
