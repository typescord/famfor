import { randomBytes } from 'crypto';
import { ReadStream, statSync } from 'fs';
import { basename } from 'path';
import { Readable } from 'stream';
import { lookup } from 'mime-types';

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';
export const DASHES = '--';
export const CRLF = '\r\n';

export type FormDataValue = Buffer | ReadStream | Readable | string;

export interface FormDataFieldOptions {
	filename?: string;
	size?: number;
	type?: string;
}

export interface FormDataField extends FormDataFieldOptions {
	value: FormDataValue;
	header: string;
}

export interface FormDataHeaders {
	'Content-Type': string;
	'Content-Length'?: string;
}

/**
 * Fast and simple Node.js multipart/form-data implementation.
 *
 * ## Examples
 * ```ts
 * const { FormData } = require('@typescord/famfor');
 *
 * const fd = new FormData();
 *
 * // if the value is a ReadStream, you can omit the filename or the size.
 * // if the size is omitted, the size will be retrieved from the file system using `fs.statSync`.
 *
 * fd.append('a_file', fs.createReadStream('./a_file.js'));
 * fd.append('a_second_file', fs.createReadStream('./a_second_file.js'), { filename: 'a_better_name.js' });
 * fd.append('another_field', 'My super field value');
 * // when the value is a Readable, you **should** specify its size (if want to have a correct length)
 * fd.append('another_field', Readable.from('My super field value'), { size: 20 });
 * fd.append('another_field', JSON.stringify({ content: 'another "another_field"' }), { type: 'application/json' });
 *
 * // an example with Got
 * got.post('https://your-super-site.com', {
 *   headers: fd.headers,
 *   body: fd.stream,
 * });
 * ```
 */
export class FormData {
	public readonly boundary = `----NodeJSFamforFormBoundary${randomBytes(14).toString('hex')}`;
	public readonly headers: FormDataHeaders = {
		'Content-Type': `multipart/form-data; boundary=${this.boundary}`,
	};

	private readonly fields = new Map<string, FormDataField[]>();
	private readonly footer = `${DASHES}${this.boundary}${DASHES}${CRLF}${CRLF}`;

	/**
	 * The FormData computed length.
	 * This can be used for the `Content-Length` header.
	 * Included in `FormData#headers` if `contentLengthHeader` is true (by default).
	 */
	public length = this.footer.length;

	/**
	 * @param contentLengthHeader - If the `Content-Length` header
	 * should be in `FormData#headers` or not, `true` by default.
	 */
	public constructor(contentLengthHeader = true) {
		if (contentLengthHeader) {
			Object.defineProperty(this.headers, 'Content-Length', { get: () => this.length, enumerable: true });
		}
	}

	public get stream(): Readable {
		return Readable.from(this.release());
	}

	private async *release(): AsyncIterableIterator<Buffer | string> {
		for (const [, fields] of this.fields) {
			for (const field of fields) {
				// set field's header
				yield field.header;

				if (field.value instanceof Readable) {
					yield* field.value;
				} else {
					yield field.value;
				}

				// add trailing carriage
				yield CRLF;
			}
		}
		yield this.footer;
	}

	/**
	 * Append a field to the FormData.
	 *
	 * @param name - The field name
	 * @param value - The field value. When the value is a ReadStream
	 * and when `options.size` is `undefined`, the
	 * ReadStream size will be fetched with `statSync`. If you don't want
	 * this behavior, you can set `options.size` to 0 (however the final length will be incomplete).
	 * @param options	- The field options
	 */
	public append(name: string, value: Buffer | string, options?: Omit<FormDataFieldOptions, 'size'>): void;
	public append(name: string, value: ReadStream, options?: FormDataFieldOptions): void;
	public append(name: string, value: Readable, options: FormDataFieldOptions & { size: number }): void;
	public append(name: string, value: FormDataValue, options: FormDataFieldOptions = {}): void {
		let filename = options.filename;
		let size = options.size;

		if (value instanceof ReadStream) {
			filename ??= value.path.toString();
			size ??= statSync(value.path).size;
		} else if (!(value instanceof Readable)) {
			size = typeof value === 'string' ? Buffer.byteLength(value) : value.byteLength;
		}

		let type = options.type;

		if (filename) {
			filename = basename(filename);
			type ??= lookup(filename) || DEFAULT_CONTENT_TYPE;
		}

		const field = {
			value,
			filename,
			type,
			size,
			header: `${DASHES}${this.boundary}${CRLF}Content-Disposition: form-data; name="${name.replaceAll('"', '\\"')}"`,
		} as FormDataField;

		if (field.filename) {
			field.header += `; filename="${field.filename.replaceAll('"', '\\"')}"${CRLF}Content-Type: ${field.type}`;
		} else if (field.type) {
			field.header += `${CRLF}Content-Type: ${field.type}`;
		}

		this.length += Buffer.byteLength((field.header += `${CRLF}${CRLF}`)) + CRLF.length + (size || 0);

		const entry = this.fields.get(name);
		entry ? entry.push(field) : this.fields.set(name, [field]);
	}

	/**
	 * Return all the values associated with
	 * a given key from within a FormData object.
	 *
	 * @param name A name of the value you want to retrieve.
	 */
	public get<T extends FormDataValue[] = FormDataValue[]>(name: string): T | undefined {
		return this.fields.get(name)?.map(({ value }: FormDataField) => value) as T;
	}

	public *values<T extends FormDataValue = FormDataValue>(): IterableIterator<T> {
		for (const [, fields] of this.fields) {
			for (const { value } of fields) {
				yield value as T;
			}
		}
	}

	public *entries<T extends FormDataValue = FormDataValue>(this: FormData): IterableIterator<[string, T]> {
		for (const [name, fields] of this.fields) {
			for (const { value } of fields) {
				yield [name, value as T];
			}
		}
	}

	public [Symbol.iterator] = this.entries;

	/**
	 * This method allows to read a content from internal stream
	 * using async generators and for-await-of APIs.
	 * An alias of FormData#stream[Symbol.asyncIterator]()
	 */
	public [Symbol.asyncIterator](): AsyncIterableIterator<Buffer> {
		return this.stream[Symbol.asyncIterator]();
	}

	public [Symbol.toStringTag] = 'FormData';
}
