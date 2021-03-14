/**
 * @private
 */
export class ContentDoc {
    /**
     * @param {Doc} doc
     */
    constructor(doc: Doc);
    /**
     * @type {Doc}
     */
    doc: Doc;
    opts: any;
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
     * @return {ContentDoc}
     */
    copy(): ContentDoc;
    /**
     * @param {number} offset
     * @return {ContentDoc}
     */
    splice(offset: number): ContentDoc;
    /**
     * @param {ContentDoc} right
     * @return {boolean}
     */
    mergeWith(right: ContentDoc): boolean;
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
export function readContentDoc(decoder: AbstractUpdateDecoder): ContentDoc;
import { Doc } from "../utils/Doc.js";
import { Transaction } from "../utils/Transaction.js";
import { Item } from "./Item.js";
import { StructStore } from "../utils/StructStore.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { AbstractUpdateDecoder } from "../utils/UpdateDecoder.js";
