import { addOne } from "./../code.js";
import * as stubRates from "./stubRates.json";

test('adds 1 + 2 to equal 3', () => {
  expect(addOne(1)).toBe(2);
});