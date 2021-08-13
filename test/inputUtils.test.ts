/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');
import { trimQuotes } from '../extension.bundle';

suite('Trim double quotes from location inputs', () => {
    test('01 - Trim double quotes and leave empty string', (() => {
      const location = `""""`;
      const trimmed = trimQuotes(location);
      assert.strictEqual(trimmed, ``);
    }));

    test('02 - Empty string input should return empty string', (() => {
      const location = ``;
      const trimmed = trimQuotes(location);
      assert.strictEqual(trimmed, ``);
    }));

    test('03 - Empty double quotes should return empty string', (() => {
      const location = `""`;
      const trimmed = trimQuotes(location);
      assert.strictEqual(trimmed, ``);
    }));

    test('04 - Single quotes should not be trimmed', (() => {
      const location = `'location'`;
      const trimmed = trimQuotes(location);
      assert.strictEqual(trimmed, `'location'`);
    }));

    test('05 - Whitespace should be trimmed first then quotes', (() => {
      const location = `   "location"   `;
      const trimmed = trimQuotes(location);
      assert.strictEqual(trimmed, `location`);
    }));
});
