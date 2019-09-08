'use strict';

import { testControllerSnapshots } from '/tests/testLib/testUtils';
import robotsController from './robotsController'();

testControllerSnapshots(robotsController, {
	index: { contexts: [{}] },
});