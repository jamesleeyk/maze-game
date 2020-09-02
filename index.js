const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;

const engine = Engine.create();
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

const name = document.querySelector('.name');
const buttonDiv = document.querySelector('.buttons');

const easyBtn = document.querySelector('.easy');
const mediumBtn = document.querySelector('.medium');
const hardBtn = document.querySelector('.hard');
const impossibleBtn = document.querySelector('.impossible');

easyBtn.addEventListener('click', () => {
  setup();
  startGame(10, 5, 7.5);
});
mediumBtn.addEventListener('click', () => {
  setup();
  startGame(16, 8, 6);
});
hardBtn.addEventListener('click', () => {
  setup();
  startGame(24, 12, 5);
});
impossibleBtn.addEventListener('click', () => {
  setup();
  startGame(34, 17, 3);
});

const setup = () => {
  name.classList.add('gone');
  buttonDiv.classList.add('gone');
  document.querySelector('.winner').classList.add('hidden');
  world.gravity.y = 0;
  for (i = 0; i < 10; i++) {
    world.bodies.forEach((body) => {
      World.remove(world, body);
    });
  }
};

startGame = (ch, cv, vel) => {
  const cellsHorizontal = ch;
  const cellsVertical = cv;

  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  const velocity = vel;
  // Walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
  ];
  World.add(world, walls);

  // Maze generation

  const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);

      counter--;

      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
    return arr;
  };

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column]. Then return
    if (grid[row][column]) {
      return;
    }
    // Mark this cell as visited
    grid[row][column] = true;
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, 'up'],
      [row, column + 1, 'right'],
      [row + 1, column, 'down'],
      [row, column - 1, 'left'],
    ]);
    // For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      // See if that neighbor is out of bounds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }
      // If we have visited that neighbor, continue to next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }
      // Remove a wall from either horizontals or verticals
      if (direction === 'left') {
        verticals[row][column - 1] = true;
      } else if (direction === 'right') {
        verticals[row][column] = true;
      } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
      } else if (direction === 'down') {
        horizontals[row][column] = true;
      }
      // Visit that next cell (recursion)
      stepThroughCell(nextRow, nextColumn);
    }
  };

  stepThroughCell(startRow, startColumn);

  // Adding Walls

  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        5,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: '#999966',
          },
        }
      );
      World.add(world, wall);
    });
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: '#999966',
          },
        }
      );
      World.add(world, wall);
    });
  });

  // Goal

  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: '#00cc66',
      },
    }
  );
  World.add(world, goal);

  // Ball

  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: 'ball',
    render: {
      fillStyle: '#0099ff',
    },
  });
  World.add(world, ball);

  // document.addEventListener('keydown', (event) => {
  //   const { x, y } = ball.velocity;
  //   if (event.keyCode === 38) {
  //     Body.setVelocity(ball, { x, y: -velocity });
  //   }
  //   if (event.keyCode === 39) {
  //     Body.setVelocity(ball, { x: velocity, y });
  //   }
  //   if (event.keyCode === 40) {
  //     Body.setVelocity(ball, { x, y: velocity });
  //   }
  //   if (event.keyCode === 37) {
  //     Body.setVelocity(ball, { x: -velocity, y });
  //   }
  //   console.log(event);
  // });

  // document.addEventListener('keyup', () => {
  //   Body.setVelocity(ball, { x: 0, y: 0 });
  // });

  let keyState = {};
  const { x, y } = ball.velocity;
  document.addEventListener('keydown', (event) => {
    keyState[event.keyCode] = true;
  });

  document.addEventListener('keyup', (event) => {
    keyState[event.keyCode] = false;
  });

  const moveLoop = () => {
    if (keyState[38]) {
      Body.setVelocity(ball, { x, y: -velocity });
    } else if (keyState[39]) {
      Body.setVelocity(ball, { x: velocity, y });
    } else if (keyState[40]) {
      Body.setVelocity(ball, { x, y: velocity });
    } else if (keyState[37]) {
      Body.setVelocity(ball, { x: -velocity, y });
    } else {
      Body.setVelocity(ball, { x: 0, y: 0 });
    }
    setTimeout(moveLoop, 10);
  };
  moveLoop();

  // Win Condition

  //   Events.on(engine, 'collisionStart', (event) => {
  //     event.pairs.forEach((collision) => {
  //       const labels = ['ball', 'goal'];

  //       if (
  //         labels.includes(collision.bodyA.label) &&
  //         labels.includes(collision.bodyB.label)
  //       ) {
  //         document.querySelector('.winner').classList.remove('hidden');
  //         world.gravity.y = 1;
  //         world.bodies.forEach((body) => {
  //           if (body.label === 'wall') {
  //             Body.setStatic(body, false);
  //           }
  //         });

  //         buttonDiv.classList.remove('gone');
  //       }
  //     });
  //   });
  // };

  // Win Condition

  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((collision) => {
      const labels = ['ball', 'goal'];
      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        if (collision.bodyA.label === 'goal') {
          World.remove(world, collision.bodyA);
        } else {
          World.remove(world, collision.bodyB);
        }
        document.querySelector('.winner').classList.remove('hidden');
        world.gravity.y = 1;
        world.bodies.forEach((body) => {
          if (body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });

        buttonDiv.classList.remove('gone');
      }
    });
  });
};
