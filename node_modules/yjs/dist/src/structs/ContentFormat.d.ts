/**
 * @private
 */
export class ContentFormat {
    /**
     * @param {string} key
     * @param {Object} value
     */
    constructor(key: string, value: Object);
    key: string;
    value: Object;
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
     * @return {ContentFormat}
     */
    copy(): ContentFormat;
    /**
     * @param {number} offset
     * @return {ContentFormat}
     */
    splice(offset: number): ContentFormat;
    /**
     * @param {ContentFormat} right
     * @return {boolean}
     */
    mergeWith(right: ContentFormat): boolean;
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
export function readContentFormat(decoder: AbstractUpdateDecoder): ContentFormat;
import { Transaction } from "../utils/Transaction.js";
import { Item } from "./Item.js";
import { StructStore } from "../utils/StructStore.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { AbstractUpdateDecoder } from "../utils/UpdateDecoder.js";
