import { combineReducers } from "redux";

import { userAccounts,  pickerSince, config, selectedAccount, typeFilters } from "./accounts";
import {rawDeployments, deployments, deploymentTypes} from "./deployments"

export default combineReducers({
  userAccounts,
  pickerSince,
  rawDeployments,
  deployments,
  deploymentTypes,
  config,
  selectedAccount,
  typeFilters
});
