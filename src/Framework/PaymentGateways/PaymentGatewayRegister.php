<?php

namespace Give\Framework\PaymentGateways;

use Give\Framework\Exceptions\Primitives\Exception;
use Give\Framework\Exceptions\Primitives\InvalidArgumentException;
use Give\Framework\PaymentGateways\Adapters\LegacyPaymentGatewayRegisterAdapter;
use Give\Framework\PaymentGateways\Contracts\PaymentGateway;
use Give\Framework\PaymentGateways\Contracts\PaymentGatewaysIterator;
use Give\Framework\PaymentGateways\Exceptions\OverflowException;

/**
 * @unreleased
 */
class PaymentGatewayRegister extends PaymentGatewaysIterator {
	protected $gateways = [];

	/**
	 * * Get Gateways
	 *
	 * @unreleased
	 *
	 * @return array
	 */
	public function getPaymentGateways() {
		return $this->gateways;
	}

	/**
	 * Get Gateway
	 *
	 * @unreleased
	 *
	 * @param  string  $id
	 *
	 * @return string
	 */
	public function getPaymentGateway( $id ) {
		if ( ! isset( $this->gateways[ $id ] ) ) {
			throw new InvalidArgumentException( "No migration exists with the ID {$id}" );
		}

		return $this->gateways[ $id ];
	}

	/**
	 * @unreleased
	 *
	 * @param string $id
	 *
	 * @return bool
	 */
	public function hasPaymentGateway( $id ) {
		return isset( $this->gateways[ $id ] );
	}

	/**
	 * Register Gateway
	 *
	 * @unreleased
	 *
	 * @param  string  $gatewayClass
	 *
	 * @throws OverflowException|InvalidArgumentException|Exception
	 */
	public function registerGateway( $gatewayClass ) {
		if ( ! is_subclass_of( $gatewayClass, PaymentGateway::class ) ) {
			throw new InvalidArgumentException( sprintf(
				'%1$s must extend %2$s',
				$gatewayClass,
				PaymentGateway::class
			) );
		}

		$gatewayId = $gatewayClass::id();

		if ( isset( $this->gateways[ $gatewayId ] ) ) {
			throw new OverflowException( "Cannot register a gateway with an id that already exists: $gatewayId" );
		}

		$this->gateways[ $gatewayId ] = $gatewayClass;

		/** @var LegacyPaymentGatewayRegisterAdapter $legacyPaymentGatewayRegisterAdapter */
		$legacyPaymentGatewayRegisterAdapter = give( LegacyPaymentGatewayRegisterAdapter::class );

		$legacyPaymentGatewayRegisterAdapter->connectGatewayToLegacyPaymentGatewayAdapter( $gatewayClass );
	}

	/**
	 * Unregister Gateway
	 *
	 * @unreleased
	 *
	 * @param $gatewayId
	 */
	public function unregisterGateway( $gatewayId ) {
		if ( isset( $this->gateways[ $gatewayId ] ) ) {
			unset( $this->gateways[ $gatewayId ] );
		}
	}
}
