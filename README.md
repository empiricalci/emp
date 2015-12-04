
# EMP

_Empirical Command Line Interface_

**emp** is a command line tool you can use to follow the **Empirical Workflow**.

# Empirical Workflow
The **Empirical workflow** is designed to make it easier to replicate computational scientific research.

### Motivation
Replicating research is hard. There are a ton of dependencies, different OSs, different environments, 
different programming languages, each project has it's own framework and there's little documentation
on how to run the damn thing. Yet, hidding behind all that mess there's an amazing algorithm that will
make a dent in the state of the art.

The future can't come soon enough. It is our mission at **Empirical** to _Accelerate the state of the art_. 
That is, make sure those dents are made faster and more often. Also we want to accelerate the time it takes
to take the approaches from the lab to the real world.

### Use cases
- Maybe just to see with my own eyes how the experiment is executed
- Test the approach on my own data. 
- Or maybe so I can tweak it and make improvements and use it as a base for my own approach. 
- Or maybe I want to use a different evaluation methodology or use it in a different problem.

### Solution Model
A replicable standalone environment that just works. In order to achieve this we can start by adopting a common framework and workflows to perform experiments. After all, we're trying to reduce as much as possible any variations to replicate the experiments. This starts during the developing process. A well designed workflow can help significantly to optimize
the development of new approaches.

### Design Principles:
The framework should be modulare so we can mix and match the different modules. Each module should do one single thing and communicate to the other modules via an stablished protocol:
- Isolate your **solver**
- Isolate your **data**
- Isolate your **evaluator**
- Isolate your **results**

### Framework
- The **data** is feeded to the **solver** by the **evaluator** in the form of a _problem_
- The **evaluator** receives the _solution_ from the **solver** and evaluates it to ouput the _results_
- A _problem_ is a command telling the **solver** to execute some task and passing the required parameters
necessary to perform the task, such as the **data**.
- A _solution_ is the output of the **solver** for a given _problem_ and it can be given in the form of a file or a return value.

The whole can be seen in the following diagram:
![framework](https://www.lucidchart.com/publicSegments/view/c4bb8431-71ba-4711-9620-b3cf49d6a8d1/image.png)

### Interface
For the **solver** and the **evaluator** to communicate there should be an _interface_ between them. This interface should be built
in the **solver** module. The interface should be able to receive parameters from the 


## Dependencies
The core enabling technology that's used in this framework is **Docker**. Docker allows us to create self-contained portable environments that work accross different platforms. This is what facilitates reproducibility since it isolates the environment and makes it replicable.

## Install


## Use
