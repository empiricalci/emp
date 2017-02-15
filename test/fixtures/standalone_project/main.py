import csv

# Define and Instantiate Solver
class Solver(object):
  def solve(self, x, y):
    solution = x + y
    return solution

solver = Solver()

def read_data():
  data_file = '/data/data.csv'
  def to_ints_tuple(row):
    return tuple(map(int, row))
  return map(to_ints_tuple, csv.reader(open(data_file, 'rb'), delimiter=','))

def read_answers():
   answer_file = '/data/answers.csv'
   ans = list(csv.reader(open(answer_file, 'rb'), delimiter=','))
   return map(lambda x: int(x[0]), ans)

# Send problems to solvers
dataset = read_data()
solutions = []
for problem in dataset:
    solutions.append(solver.solve(*problem))

# Evaluate solutions against ground truth
answers = read_answers()
correct_count = 0
for i in xrange(len(dataset)):
    if solutions[i] == answers[i]:
        correct_count = correct_count + 1

accuracy = correct_count / len(dataset)

# Save overall
results = {
    'metric': 'Accuracy',
    'value': accuracy
}

import json
with open('/workspace/overall.json', 'w') as output:
    json.dump(results, output)
