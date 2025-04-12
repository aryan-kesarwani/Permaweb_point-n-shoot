import axios from 'axios';

const query = `{
  transactions(
    tags: [
      { name: "Content-Type", values: ["image/jpeg"] }
      { name: "Device", values: ["ESP32-CAM"] }
    ]
    first: 100
  ) {
    edges {
      node {
        id
        block { 
        height 
        timestamp
        }
      }
    }
  }
}`;

const result = await axios.post('https://arweave.net/graphql', { query });
console.log(result.data.data.transactions.edges);
