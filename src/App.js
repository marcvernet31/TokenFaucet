import * as React from 'react';
import { useState, useEffect} from 'react'

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import TokenA_abi from './utils/TokenFaucet_A.json'
import TokenB_abi from './utils/TokenFaucet_B.json'

const { ethers } = require("ethers");

const tokenContracts = {
  TokenA: {
    contractAddress: "0xC0f6299e11E0BDE2629Eb6c7C4837085Fa807972",
    contractABI: TokenA_abi.abi
  },
  TokenB: {
    contractAddress: "0x96192288c47030CE40BAd1247EAE440F0DAD04d5",
    contractABI: TokenB_abi.abi
  },
};

const tokens = ["TokenA", "TokenB"]

const theme = createTheme({
  palette: {
    background: {
      default: "#e4f0e2"
    }
  }
});

const Title = () => {
  return(
    <>
      <Typography
        component="h1"
        variant="h2"
        align="center"
        color="text.primary"
        gutterBottom
      >
        🪙 Token Faucet 🪙
      </Typography>
      <Typography variant="h5" align="center" color="text.secondary" paragraph>
        A Faucet is a tool that provides a small amount of funds to start using 
        a cryptocurrency without having to buy some. 
      </Typography>
    </>
  )
}

const Notification = ({notification, setNotification}) => {
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(false);
  };

  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        OK
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return(
    <div>
    <Snackbar
      open={notification}
      autoHideDuration={6000}
      onClose={handleClose}
      message="Token sended successfully"
      action={action}
    />
  </div>
  )
}

export default function App() {
  const [balance, setBalance] = useState("0")
  const [token, setToken] = useState('TokenA');
  const [notification, setNotification] = useState(false)
  const [currentAccount, setCurrentAccount] = useState("");
  const [timeLock, setTimeLock] = useState("0")


  const connectWallet = async () => {
    try {
      const { ethereum } = window;
 
      if (!ethereum) {
        alert("Install MetaMask!");
        return;
      }
 
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
 
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }


  const checkIfWalletIsConnected = async () => {
    try {
      //     * First make sure we have access to window.ethereum
      const { ethereum } = window;

      // Find ethereum object
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        //await getBalance()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const updateBalance = async() => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const contractAddress = tokenContracts[token]["contractAddress"]
        const contractABI = tokenContracts[token]["contractABI"]
        console.log("contractAddress", contractAddress)
        console.log("contractABI", contractABI)
        const TokenContract = new ethers.Contract(contractAddress, contractABI, signer);

        //console.log(currentAccount)
        const retrievedBalance = await TokenContract.balanceOf(currentAccount)
        setBalance((retrievedBalance / 10**18).toString())

        const retrievedTimelock = await TokenContract.getLockTime(currentAccount)
        setTimeLock(retrievedTimelock.toString())

      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }


  // Change selected token to mint
  const handleTokenChange = (event) => {
    setToken(event.target.value);
  };


  // Mint token to wallet
  const sendToken = async() => {
    const contractAddress = tokenContracts[token]["contractAddress"]
    const contractABI = tokenContracts[token]["contractABI"]
    
    try{
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const TokenContract = new ethers.Contract(contractAddress, contractABI, signer);

        await TokenContract.requestTokens(currentAccount, 10)

        setNotification(true);
      } else {
        console.log("Ethereum object doesn't exist!")
      }

    } catch (error) {
      console.log(error);
    }

  }


  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        <Box sx={{ pt: 8, pb: 6 }} >
          <Container maxWidth="sm">
            <Title/>
            <Box textAlign="center" sx={{ p: 5, border: '1px dashed grey'}}>
              { currentAccount != '' ? (
                <Stack
                  sx={{ pt: 4 }}
                  direction="column"
                  spacing={2}
                  justifyContent="center"
                >
                  <TextField
                    id="filled-select-currency"
                    select
                    label="Select"
                    value={token}
                    onChange={handleTokenChange}
                    helperText="Select token to get"
                    variant="filled"
                  >
                    {tokens.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <p> {currentAccount} </p>
                  <p> Time Lock: {timeLock - (Math.round((new Date()).getTime() / 1000))} seconds</p>
                  <p> Your balance: {balance} {token} </p>
                  <Button onClick={updateBalance}> Update Balance </Button>
                  <Button 
                    align="center" 
                    variant="contained" 
                    onClick={sendToken}
                  > 
                    Receive 
                  </Button>
                </Stack>
              ) : (
              <Button 
                align="center" 
                variant="contained" 
                onClick={connectWallet}
              > 
                Connect wallet 
              </Button>
              )}
 
            </Box>
          </Container>
          <Notification notification={notification} setNotification={setNotification}/>
        </Box> 
      </main>
    </ThemeProvider>
  );
}

