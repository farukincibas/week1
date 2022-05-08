#!/bin/bash

cd contracts/circuits

mkdir LessThan

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling LessThan10.circom..."

# compile circuit

circom LessThan10.circom --r1cs --wasm --sym -o LessThan
snarkjs r1cs info LessThan/LessThan10.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup LessThan/LessThan10.r1cs powersOfTau28_hez_final_10.ptau LessThan/circuit_0000.zkey
snarkjs zkey contribute LessThan/circuit_0000.zkey LessThan/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey LessThan/circuit_final.zkey LessThan/verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier LessThan/circuit_final.zkey ../LessThan10.sol

cd ../..