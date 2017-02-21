iteration = 0
first = 1
second = 1
third = 1

show()
wear 'pencil'

speed 100
for [1..500]
  fd iteration
  dot red, iteration / 15 + 2
  rt 360 * (first / second)
  iteration += 1
  first = second + third
  second = third
  third = first
