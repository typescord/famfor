# FormData

Powerful FormData implementation for Node.js. Built over `stream.Readable` stream and async generators.

[![Continuous Integration](https://github.com/typescord/form-data/actions/workflows/main.yml/badge.svg)](https://github.com/typescord/form-data/actions/workflows/main.yml)

## Installation

You can install this package:

```
npm install @typescord/form-data
# or with Yarn
yarn add @typescord/form-data
```

## Usage

Each FormData instance allows you to read its data from `stream.Readable` stream,
just use `FormData#stream` property for that.

You can send queries via HTTP clients that supports headers setting stream.Readable stream as body.

Let's take a look at minimal example with [got](https://github.com/sindresorhus/got):

```js
import FormData from '@typescord/form-data';
import got from 'got';

const fd = new FormData();
fd.set('greeting', 'Hello, World!');

// in async context
const contentLength = await fd.getComputedLength();
const options = {
	body: fd.stream, // set internal stream as request body
	headers: {
		...fd.headers, // set headers of the current FormData instance
		'Content-Length': contentLength !== undefined ? contentLength.toString() : undefined,
	},
};

got.post('https://example.com', options).text().then(console.log).catch(console.error);
```

## API

### `constructor FormData([entries])`

Initialize new FormData instance

- **{array}** [entries = undefined] – an optional FormData initial entries.
  Each initial field should be passed as a collection of the objects
  with "name", "value" and "filename" props.
  See the [FormData#set()](#setname-value-filename-options---void) for more info about the available format.

#### Instance properties

#### `boundary -> {string}`

Returns a boundary string of the current `FormData` instance.

#### `stream -> {stream.Readable}`

Returns an internal [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable) stream. Use it to send queries, but don't push
anything into it.

#### `headers -> {object}`

Returns frozen object with `content-type` header

#### Instance methods

#### `set(name, value[, filename, options]) -> {void}`

Set a new value for an existing key inside **FormData**,
or add the new field if it does not already exist.

- **{string}** name – The name of the field whose data is contained in **value**
- **{string | [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) | [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable) | [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) | [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts)}** value – The field value.
- **{string}** [filename = undefined] – A filename of given field. Can be added only for [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer), [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable), [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) and [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts).
- **{object}** [object = {}] - Additional field options
- **{number}** [object.size = undefined] – A size of field's content. If it set on a stream, then given stream will be treated as File-like object.
  Can be omited for [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts) and [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) values or if you don't know the **actual** length of the stream.

#### `append(name, value[, filename, options]) -> {void}`

Appends a new value onto an existing key inside a FormData object,
or adds the key if it does not already exist.

- **{string}** name – The name of the field whose data is contained in **value**
- **{string | [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) | [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable) | [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) | [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts)}** value – The field value.
- **{string}** [filename = undefined] – A filename of given field. Can be added only for [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer), [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable), [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) and [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts).
- **{number}** [object.size = undefined] – A size of field's content. If it set on a stream, then given stream will be treated as [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts) object.
  Can be omited for [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts) and [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) values or if you don't know the **actual** length of the stream.

#### `get<T>(name) -> {string | stream.Readable | fs.ReadStream | File}`

Returns the first value associated with the given name.
If the field has [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) or any [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable) and [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) (and when options.size is set for this stream) value, the [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts) object will be returned.

- **{string}** name – A name of the value you want to retrieve.

#### `getAll<T>(name) -> {Array<string | stream.Readable | fs.ReadStream | Buffer | File>}`

Returns all the values associated with a given key from within a **FormData** object.
If the field has [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) or any [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_stream.Readable) and [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream) (and when options.size is set for this stream) value, the [`File`](https://github.com/typescord/form-data/blob/main/src/helpers/file.ts) object will be returned.

- **{string}** name – A name of the value you want to retrieve.

#### `has(name) -> {boolean}`

Check if a field with the given **name** exists inside **FormData**.

- **{string}** – A name of the field you want to test for.

#### `delete(name) -> {void}`

Deletes a key and its value(s) from a `FormData` object.

- **{string}** name – The name of the key you want to delete.

#### `getComputedLength() -> {Promise<number | undefined>}`

Returns computed length of the FormData content. If FormData instance contains
a stream value with unknown length, the method will always return `undefined`.

#### `keys() -> {IterableIterator<string>}`

Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through the **FormData** keys

#### `values() -> {IterableIterator<any>}`

Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through the **FormData** values

#### `entries() -> {IterableIterator<[string, any]>}`

Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through the **FormData** key/value pairs

#### `[Symbol.iterator]() -> {IterableIterator<[string, any]>}`

An alias of [FormData#entries](#entries---iterator)

#### `[Symbol.asyncIterator]() -> {AsyncIterableIterator<Buffer>}`

Returns an async iterator allowing to read a data from internal stream.Readable stream using **for-await** syntax.
Read the [async iteration proposal](https://github.com/tc39/proposal-async-iteration) to get more info about async iterators.

## Related links

- [`web-streams-polyfill`](https://github.com/MattiasBuelens/web-streams-polyfill) a Web Streams, based on the WHATWG spec reference implementation.
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) interface documentation on MDN
