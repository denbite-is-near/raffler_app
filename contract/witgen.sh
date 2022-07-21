witme near wit -p sdk.wit -o contract.wit
witme near ts -i contract.wit -o ts_interface

# remove generate wit file
rm contract.wit

mv ts_interface/helper.ts ../ui/types/helper.ts
mv ts_interface/index.ts ../ui/types/raffler_contract.ts

# remove generate TS interfaces folder
rm -rf ts_interface
