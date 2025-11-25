import type { Contract } from '../../../types';

/**
 * Contract Status Info Component
 * Displays information about the primary contract or a message if no contract exists
 */

interface ContractStatusInfoProps {
  primaryContract: Contract | null;
}

export function ContractStatusInfo({ primaryContract }: ContractStatusInfoProps) {
  if (primaryContract) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <strong>Editing Contract:</strong> {primaryContract.status} contract 
          {primaryContract.start_date && primaryContract.end_date && 
            ` (${primaryContract.start_date} to ${primaryContract.end_date})`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p className="text-sm text-yellow-700">
        <strong>No Contract Found:</strong> A new contract will be created for this tenant.
      </p>
    </div>
  );
}

