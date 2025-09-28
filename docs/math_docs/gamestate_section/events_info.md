# Game Event Structures

Events are the JSON objects returned from the RGS `play/` API and make up the vast majority of data with a game's _library_. Events contain all information required by the front-end to display the current state of the game. Anything not contained within or implied by the events cannot be shown to the player. For a typical game this includes, but is not limited to

- Active game-board symbols
- Freespin counters
- Win counters
- Symbol win information
- Multipliers
- Special symbol actions
- ....

The events are crucial as all events need to be handled by the front-end. The user is free to determine their event structure, though to follow the example games, all events have the format,

```python
event = {
    "index": [int],
    "type": [str],
    "<field_1>": [T],
    ...
    "<field_n>": [T]
}
```

`"index"` keeps track of the current number of events in a simulation, `"type"` is a unique keyword used to identify an event and is generally a one-word description. `"fields"` are strings who's corresponding value can have any data-type, as required. Once constructed, the event is appended to the book, "events" field":

```python
gamestate.book.add_event(event)
```

Events are handled separately in the gamestate to game calculations or executables. They are imported explicitly and not attached to the gamestate object. Once the math-engine has made the appropriate board transformation or action, the event should be emitted immediately, as it will provide a _snapshot_ of the current state of the game. For example:

```python
 from src.Events.Events import update_freespin_event
 run_spin():
    ...
    update_freespin_event(self)
    ....
```

These events should be sent anytime new information needs to be communicated to the player.
