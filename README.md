# Famfor

Simple, powerful, and fast multipart/form-data implementation for Node.js. Built over `Readable` stream and async generators.

[![Continuous Integration](https://github.com/typescord/famfor/actions/workflows/main.yml/badge.svg)](https://github.com/typescord/famfor/actions/workflows/main.yml)

## Installation

```sh
$ npm install @typescord/famfor
# or with Yarn
$ yarn add @typescord/famfor
```

## Usage

Each FormData instance allows you to read its data from `stream.Readable` stream,
just use `FormData#stream` for that.

A `value` is considered as file if it's a `ReadStream` or if it have a `filename`.
When the `value` is a `ReadStream`, the `size` can be omitted, in this case, the `size`
will be retrieved from the file system using `fs.statSync`.
Else, if the `value` is a `Readable`, the `size` **should** be specified (if you want to have a correct length).

If the `type` is present, it will be always put (even if the `filename` is not present).

You can send queries via HTTP clients that supports headers setting `stream.Readable` stream as body.

Let's take a look at minimal example with [Got](https://github.com/sindresorhus/got) :

```ts
import { FormData } from '@typescord/form-data'; // const { FormData } = require('@typescord/form-data');
import got from 'got'; // const got = require('got');

const fd = new FormData();
// or `new FormData(false);` if you don't want the `Content-Length` header in `FormData#headers`

fd.append('a_file', fs.createReadStream('./a_file.js'));
fd.append('a_second_file', fs.createReadStream('./a_second_file.js'), { filename: 'a_better_name.js' });
fd.append('another_field', 'My super field value');
// when the value is a Readable, you **should** specify it's size (if want to have a correct length)
fd.append('another_field', Readable.from('My super field value'), { size: 20 });
fd.append('another_field', JSON.stringify({ content: 'another "another_field"' }), { type: 'application/json' });
fd.append('yet_another_field', JSON.stringify({ content: "eééè'`e" }), { type: 'application/json; charset=utf-8' }); // for example

// you can get the size simply with (it's already included in the `headers`) :
console.log(fd.length);

got
	.post('https://example.com/', {
		body: fd.stream, // set internal stream as request body
		headers: fd.headers, // contains Content-Type and optionally Content-Length (see constructor's `contentLengthHeader` option)
	})
	.text()
	.then(console.log)
	.catch(console.error);
```
