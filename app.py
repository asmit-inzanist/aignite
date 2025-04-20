from flask import Flask, render_template, request, jsonify
import os
import json
import time
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

from ai_handler import find_img
from utils import input_img_setup

load_dotenv()

app = Flask(__name__)

# Web3 and contract setup
w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL')))
contract_address = Web3.to_checksum_address(os.getenv('CONTRACT_ADDRESS'))
account_address = Web3.to_checksum_address(os.getenv('METAMASK_ACCOUNT_ADDRESS'))
private_key = os.getenv('PRIVATE_KEY')

with open('static/contract_abi.json') as f:
    contract_abi = json.load(f)

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

def load_prompts():
    with open('prompts.json', 'r') as file:
        return json.load(file)

def get_prompt(key, default=None):
    prompts = load_prompts()
    return prompts.get(key, default)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    uploaded_file = request.files.get('file')
    user_input = request.form.get('user_input')
    prompt_type = request.form.get('prompt_type')

    if not uploaded_file:
        return jsonify({"error": "No file uploaded"})

    image_data = input_img_setup(uploaded_file)
    prompt = get_prompt(prompt_type, user_input)

    time.sleep(15)
    response = find_img(prompt, image_data)

    return jsonify({"response": response})

@app.route('/claim', methods=['POST'])
def claim():
    try:
        nonce = w3.eth.get_transaction_count(account_address)

        txn = contract.functions.claimReward().build_transaction({
            'chainId': w3.eth.chain_id,
            'gas': 200000,
            'gasPrice': w3.to_wei('20', 'gwei'),
            'nonce': nonce
        })

        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        streak = contract.functions.getStreak().call({'from': account_address})
        balance = contract.functions.getRewardBalance().call({'from': account_address})

        return jsonify({
            'message': 'Reward claimed successfully!',
            'txHash': tx_hash.hex(),
            'streak': streak,
            'balance': balance
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
