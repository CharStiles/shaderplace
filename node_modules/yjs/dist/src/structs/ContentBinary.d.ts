export class ContentBinary {
    /**
     * @param {Uint8Array} content
     */
    constructor(content: Uint8Array);
    content: Uint8Array;
    /**
     * @return {number}
     */
    getLength(): number;
    /**
     * @return {Array<any>}
     */
    getContent(): Array<any>;
    /**
     * @return {boolean}
     */
    isCountable(): boolean;
    /**
     * @return {ContentBinary}
     */
    copy(): ContentBinary;
    /**
     * @param {number} offset
     * @return {ContentBinary}
     */
    splice(offset: number): ContentBinary;
    /**
     * @param {ContentBinary} right
     * @return {boolean}
     */
    mergeWith(right: ContentBinary): boolean;
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction: Transaction, item: Item): void;
    /**
     * @param {Transaction} transaction
     */
    delete(transaction: Transaction): void;
    /**
     * @param {StructStore} store
     */
    gc(store: StructStore): void;
    /**
     * @param {AbstractUpdateEncoder} encoder
     * @param {number} offset
     */
    write(encoder: AbstractUpdateEncoder, offset: number): void;
    /**
     * @return {number}
     */
    getRef(): number;
}
export function readContentBinary(decoder: AbstractUpdateDecoder): ContentBinary;
import { Transaction } from "../utils/Transaction.js";
import { Item } from "./Item.js";
import { StructStore } from "../utils/StructStore.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { AbstractUpdateDecoder } from "../utils/UpdateDecoder.js";
