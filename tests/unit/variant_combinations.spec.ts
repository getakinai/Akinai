import { test } from '@japa/runner'
import {
  DEFAULT_VARIANT_TITLE,
  buildCombinations,
  combinationKey,
} from '#services/variant_combinations'

test.group('variant combinations', () => {
  test('a product without options resolves to one default combination', ({ assert }) => {
    assert.deepEqual(buildCombinations([]), [{ key: '', title: DEFAULT_VARIANT_TITLE, pairs: [] }])
  })

  test('builds the cartesian product in option order', ({ assert }) => {
    const combinations = buildCombinations([
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Color', values: ['Red', 'Blue'] },
    ])

    assert.deepEqual(
      combinations.map(({ title }) => title),
      ['Small / Red', 'Small / Blue', 'Medium / Red', 'Medium / Blue']
    )
    assert.deepEqual(combinations[1].pairs, [
      { optionName: 'Size', value: 'Small' },
      { optionName: 'Color', value: 'Blue' },
    ])
  })

  test('multiplies the values of every option', ({ assert }) => {
    const combinations = buildCombinations([
      { name: 'Size', values: ['S', 'M', 'L'] },
      { name: 'Color', values: ['Red', 'Blue'] },
      { name: 'Material', values: ['Cotton', 'Linen'] },
    ])

    assert.lengthOf(combinations, 12)
    assert.lengthOf(new Set(combinations.map(({ key }) => key)), 12)
  })

  test('the combination key ignores option order', ({ assert }) => {
    const a = combinationKey([
      { optionName: 'Size', value: 'S' },
      { optionName: 'Color', value: 'Red' },
    ])
    const b = combinationKey([
      { optionName: 'Color', value: 'Red' },
      { optionName: 'Size', value: 'S' },
    ])

    assert.equal(a, b)
  })

  test('the combination key ignores case and surrounding spaces', ({ assert }) => {
    assert.equal(
      combinationKey([{ optionName: ' size ', value: 'SMALL' }]),
      combinationKey([{ optionName: 'Size', value: 'small' }])
    )
  })
})
