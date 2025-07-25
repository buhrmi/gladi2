import { createConsumer } from "@rails/actioncable";
import {get,set} from '@eivifj/dot';

let consumer

export let State = $state({})

const mutators = {
  set(path, data) {;
    set(State, path, data);
  },
  assign(path, data) {
    const currentValue = get(State, path);
    if (currentValue) Object.assign(currentValue, data);
    else set(State, path, data);
  },
  upsert(path, data) {
    const updates = Array.isArray(data.value) ? data.value : [data.value];
    const target = get(State, path);
    if (!target) set(State, path, updates);
    else updates.forEach(entry => {
      const item = target.find(item => item[data.key] === entry[data.key]);
      if (item) Object.assign(item, entry);
      else target.push(entry);
    })
  },
  delete(path, selector) {
    const target = get(State, path);
    if (Array.isArray(target)) {
      const [key, value] = Object.entries(selector)[0];
      const index = target.findIndex(item => item[key] === value);
      if (index !== -1) target.splice(index, 1);
    }
    else {
      delete target[selector];
    }
  }
}

export function registerMutator(name, mutator) {
  mutators[name] = function(path, data) {
    const currentValue = get(State, path);
    const newValue = mutator(currentValue, data);
    set(State, path, newValue);
  }
}

export function registerHook(path, hook) {
  if (!hooks[path]) {
    hooks[path] = [];
  }
  hooks[path].push(hook);
}

function received(data) {
  const path = Array.isArray(data.path) ? data.path.join('.') : data.path;
  const mutator = mutators[data.action]
  if (mutator) {
    mutator(path, data.data);
  } 
  else {
    const target = get(State, path);
    if (target && typeof target[data.action] === 'function') {
      target[data.action](data.data);
    }
    else {
      console.error(`No mutator or method found for action "${data.action}" on path "${path}"`);
    }
  }
}

export function subscribe(channel, params = {}) {
  if (typeof document == "undefined") return () => {};

  if (!consumer) consumer = createConsumer();

  const subscription = consumer.subscriptions.create(
    { channel, ...params },
    {
      received,
    },
  );

  return function unsubscribe() {
    consumer.subscriptions.remove(subscription);
  };
}

export function reset() {
  Object.keys(State).forEach(key => {
    delete State[key];
  });
}