# Minigames

Standalone little games that live alongside Terra Prime but do not depend on it.

Nothing in here is imported by the SvelteKit app in `site/`, touches the database, or is
part of the Docker build. Each game is its own self-contained project — it only borrows
the *look* of the main site: the old-school green-on-black CRT terminal.

## Games

| Game                         | Stack         | Description                                        |
| :--------------------------- | :------------ | :------------------------------------------------- |
| [`simon-says/`](simon-says/) | Python/pygame | Repeat the growing signal sequence before it fades. |

## Adding a minigame

Each game gets its own subdirectory containing everything it needs to run:

```
minigames/<game-name>/
├── README.md          # what it is, how to install, how to play
├── requirements.txt   # or package.json, or whatever the stack needs
├── .gitignore         # build output, virtualenvs, save files
└── <source>
```

Then add a row to the table above.

Keep games dependency-light and runnable with a single command from their own directory.
Save files, high scores and virtualenvs stay out of git.
