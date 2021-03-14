export class AbstractStruct {
    /**
     * @param {ID} id
     * @param {number} length
     */
    constructor(id: ID, length: number);
    id: ID;
    length: number;
    /**
     * @type {boolean}
     */
    get deleted(): boolean;
    /**
     * Merge this struct with the item to the right.
     * This method is already assuming that `this.id.clock + this.length === this.id.clock`.
     * Also this method does *not* remove right from StructStore!
     * @param {AbstractStruct} right
     * @return {boolean} wether this merged with right
     */
    mergeWith(right: AbstractStruct): boolean;
    /**
     * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
     * @param {number} offset
     * @param {number} encodingRef
     */
    write(encoder: AbstractUpdateEncoder, offset: number, encodingRef: number): void;
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction: Transaction, offset: number): void;
}
import { ID } from "../utils/ID.js";
import { AbstractUpdateEncoder } from "../utils/UpdateEncoder.js";
import { Transaction } from "../utils/Transaction.js";
