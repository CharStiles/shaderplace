export class ContentAny {
    /**
     * @param {Array<any>} arr
     */
    constructor(arr: Array<any>);
    /**
     * @type {Array<any>}
     */
    arr: Array<any>;
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
     * @return {ContentAny}
     */
    copy(): ContentAny;
    /**
     * @param {number} offset
     * @return {ContentAny}
     */
    splice(offset: number): ContentAny;
    /**
     * @param {ContentAny} right
     * @return {boolean}
     */
    mergeWith(right: ContentAny): boolean;
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
export function readContentAny(decoder: AbstractUpdateDecoder): ContentAny;
import { Transaction } from "../utils/Transaction.js";
import { Item } from "./Item.js";
import { StructStore } from "../utils/StructStore.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { AbstractUpdateDecoder } from "../utils/UpdateDecoder.js";
