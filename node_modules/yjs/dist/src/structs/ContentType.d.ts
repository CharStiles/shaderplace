/**
 * @type {Array<function(AbstractUpdateDecoder):AbstractType<any>>}
 * @private
 */
export const typeRefs: Array<(arg0: AbstractUpdateDecoder) => AbstractType<any>>;
export const YArrayRefID: 0;
export const YMapRefID: 1;
export const YTextRefID: 2;
export const YXmlElementRefID: 3;
export const YXmlFragmentRefID: 4;
export const YXmlHookRefID: 5;
export const YXmlTextRefID: 6;
/**
 * @private
 */
export class ContentType {
    /**
     * @param {AbstractType<YEvent>} type
     */
    constructor(type: AbstractType<YEvent>);
    /**
     * @type {AbstractType<any>}
     */
    type: AbstractType<any>;
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
     * @return {ContentType}
     */
    copy(): ContentType;
    /**
     * @param {number} offset
     * @return {ContentType}
     */
    splice(offset: number): ContentType;
    /**
     * @param {ContentType} right
     * @return {boolean}
     */
    mergeWith(right: ContentType): boolean;
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
export function readContentType(decoder: AbstractUpdateDecoder): ContentType;
import { AbstractUpdateDecoder } from "../utils/UpdateDecoder.js";
import { AbstractType } from "../types/AbstractType.js";
import { Transaction } from "../utils/Transaction.js";
import { Item } from "./Item.js";
import { StructStore } from "../utils/StructStore.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { YEvent } from "../utils/YEvent.js";
