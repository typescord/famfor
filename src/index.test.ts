/* eslint-disable unicorn/no-useless-undefined */
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { basename } from 'path';
import { CRLF, DASHES, FormData } from '.';

async function readableToString(readable: Readable): Promise<string> {
	let stringified = '';
	for await (const chunk of readable) {
		stringified += chunk.toString();
	}
	return stringified;
}

describe('FormData', () => {
	it('should be instance of Map', () => {
		expect(new FormData()).toBeInstanceOf(Map);
	});

	it("it should have some undefined Map's methods", () => {
		const fd = new FormData();
		expect(fd).toHaveProperty('forEach', undefined);
		expect(fd).toHaveProperty('set', undefined);
	});

	it('should have a correct boundary', () => {
		const boundary = new FormData().boundary;
		expect(boundary.startsWith('----NodeJSFamforFormBoundary')).toStrictEqual(true);
		expect(boundary).toHaveLength(56);
	});

	it('should have a correct footer', () => {
		// @ts-expect-error footer is private
		const { footer, boundary } = new FormData();
		expect(footer).toStrictEqual(`${DASHES}${boundary}${DASHES}${CRLF}${CRLF}`);
		expect(footer).toHaveLength(64);
	});
});

describe('FormData#append', () => {
	it('should return a correct body', async () => {
		const fd = new FormData();
		fd.append('"name"', 'value', { filename: '"name"' });
		const body = await readableToString(fd.stream);
		expect(body).toContain('name="\\"name\\""');
		expect(body).toContain('filename="\\"name\\"');
	});

	it('should retrieve the length of the ReadStream', async () => {
		const fd = new FormData();
		const { size } = await stat(__filename);
		fd.append('name', createReadStream(__filename), { filename: 'name' });
		// @ts-expect-error footer is private
		expect(fd.length).toStrictEqual(110 + size + fd.footer.length + fd.boundary.length);
	});

	it("shouldn't retrieve the length of the ReadStream when size is specified", async () => {
		const fd = new FormData();
		fd.append('name', createReadStream(__filename), { filename: 'name', size: 0 });
		// @ts-expect-error footer is private
		expect(fd.length).toStrictEqual(110 + fd.footer.length + fd.boundary.length);
	});

	it('should use ReadStream path as filename when the filename is not specified', async () => {
		const fd = new FormData();
		fd.append('name', createReadStream(__filename), { size: 0 });
		// @ts-expect-error footer is private
		expect(await readableToString(fd)).toContain(`filename="${basename(__filename)}"`);
	});
});

describe('FormData#length', () => {
	it("should be correct when the Readable's size is (not) specified", () => {
		const fd = new FormData();
		fd.append('name', Readable.from('value'), { filename: 'abcd', size: 5 });
		fd.append('name', Readable.from('value'), { filename: 'abcd', size: 0 });
		// @ts-expect-error footer is private
		expect(fd.length).toStrictEqual((110 + fd.boundary.length) * 2 + 5 + fd.footer.length);
	});

	it('should be correct', () => {
		const fd = new FormData();
		fd.append('name', Readable.from('value'), { filename: 'abcd', size: 5 });
		fd.append('name', Buffer.from('value'), { filename: 'abcd' });
		fd.append('name', 'value', { filename: 'abcd' });
		fd.append('name', 'value');
		fd.append('name', Buffer.from('value'));
		// @ts-expect-error footer is private
		expect(fd.length).toStrictEqual(115 * 3 + 58 * 2 + fd.boundary.length * 5 + fd.footer.length);
	});
});

describe('FormData#stream', () => {
	it('should return the correct body', async () => {
		const fd = new FormData();
		fd.append('name', 'value', { filename: 'abc' });
		fd.append('name', Buffer.from('value'), { filename: 'abc' });
		fd.append('name', Readable.from('value'), { filename: 'abc', size: 5 });
		expect(await readableToString(fd.stream)).toStrictEqual(
			`${DASHES}${
				fd.boundary
			}${CRLF}Content-Disposition: form-data; name="name"; filename="abc"${CRLF}Content-Type: application/octet-stream${CRLF.repeat(
				2,
				// @ts-expect-error footer is private
			)}value${CRLF}`.repeat(3) + fd.footer,
		);
	});
});

describe('FormData#headers', () => {
	it('should return the correct headers', () => {
		const fd = new FormData();
		fd.append('name', Readable.from('value'), { filename: 'abcd', size: 5 });
		fd.append('name', Buffer.from('value'), { filename: 'abcd' });
		fd.append('name', 'value', { filename: 'abcd' });
		fd.append('name', 'value');
		fd.append('name', Buffer.from('value'));
		expect(fd.headers).toStrictEqual({
			'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
			'Content-Length': fd.length,
		});
	});

	it('should not include content-length in the headers', () => {
		const fd = new FormData(false);
		fd.append('name', Readable.from('value'), { filename: 'abcd', size: 5 });
		fd.append('name', Buffer.from('value'), { filename: 'abcd' });
		fd.append('name', 'value', { filename: 'abcd' });
		fd.append('name', 'value');
		fd.append('name', Buffer.from('value'));
		expect(fd.headers).toStrictEqual({
			'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
		});
	});
});
