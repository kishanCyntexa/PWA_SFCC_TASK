
import React, {forwardRef, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {useIntl, FormattedMessage} from 'react-intl'
import {
    Flex,
    Heading,
    Button,
    Skeleton,
    Box,
    Text,
    VStack,
    Fade,
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import ImageGallery from '@salesforce/retail-react-app/app/components/image-gallery'
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import {getDisplayPrice} from '@salesforce/retail-react-app/app/utils/product-utils'
const ProductViewHeader = ({name, category, productType, shortDescription}) => {
    const isProductASet = productType?.set

    return (
        <VStack mr={4} spacing={2} align="flex-start" marginBottom={4, 4, 4, 0, 0}>
            {category && (
                <Skeleton isLoaded={category} minWidth={64}>
                    <Breadcrumb categories={category} />
                </Skeleton>
            )}

            {/* Title */}
            <Skeleton>
                <Heading fontSize="2xl">{`${name}`}</Heading>
            </Skeleton>
        </VStack>
    )
}
ProductViewHeader.propTypes = {
    name: PropTypes.string,
    basePrice: PropTypes.number,
    discountPrice: PropTypes.number,
    currency: PropTypes.string,
    category: PropTypes.array,
    productType: PropTypes.object,
    shortDescription: PropTypes.string
}
//const ButtonWithRegistration = withRegistration(Button)
const ProductView = forwardRef(
    (
        {
            product,
            category,
            showFullLink = false,
            imageSize = 'md',
            isWishlistLoading = false,
            isProductPartOfSet = false,
            isBasketLoading = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel
        },
        ref
    ) => {
        const showToast = useToast()
        const intl = useIntl()
        const location = useLocation()
        const {
            isOpen: isAddToCartModalOpen,
            onOpen: onAddToCartModalOpen,
            onClose: onAddToCartModalClose
        } = useAddToCartModalContext()
        const theme = useTheme()
        const [showOptionsMessage, toggleShowOptionsMessage] = useState(false)
        const {
            showLoading,
            showInventoryMessage,
            inventoryMessage,
            quantity,
            minOrderQuantity,
            setQuantity,
            variant,
            variationParams,
            variationAttributes,
            stockLevel,
            stepQuantity
        } = useDerivedProduct(product, isProductPartOfSet)
        const {basePrice, discountPrice} = getDisplayPrice(product)
        const canAddToWishlist = !isProductLoading
        const isProductASet = product?.type.set
        const errorContainerRef = useRef(null)
        const validateAndShowError = (opts = {}) => {
            const {scrollErrorIntoView = true} = opts
            // Validate that all attributes are selected before proceeding.
            const hasValidSelection = validateOrderability(variant, quantity, stockLevel)
            const showError = !isProductASet && !hasValidSelection
            const scrollToError = showError && scrollErrorIntoView
            toggleShowOptionsMessage(showError)
            if (scrollToError) {
                errorContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }
            return hasValidSelection
        }
        useEffect(() => {
            if (!isProductASet && validateOrderability(variant, quantity, stockLevel)) {
                toggleShowOptionsMessage(false)
            }
        }, [variationParams])
        useEffect(() => {
            if (variant) {
                onVariantSelected(product, variant, quantity)
            }
        }, [variant?.productId, quantity])
        return (
            <Flex direction={'column'} data-testid="product-view" ref={ref}>
                {/* Basic information etc. title, price, breadcrumb*/}
                <Box display={['block', 'block', 'block', 'none']}>
                    <ProductViewHeader
                        name={product?.name}
                        basePrice={basePrice}
                        discountPrice={discountPrice}
                        productType={product?.type}
                        currency={product?.currency}
                        category={category}
                        shortDescription={product?.shortDescription}
                    />
                </Box>
                <Flex direction={['column', 'column', 'column', 'row']}>
                    <Box flex={1} mr={[0, 0, 0, 6, 6]}>
                        {product ? (
                            <>
                                <ImageGallery
                                    size={imageSize}
                                    imageGroups={product.imageGroups}
                                    selectedVariationAttributes={variationParams}
                                />
                                <HideOnMobile>
                                    {showFullLink && product && (
                                        <Link
                                            to={`/product/${product.master.masterId}`}
                                            color="blue.600"
                                        >
                                            <FormattedMessage
                                                id="product_view.link.full_details"
                                                defaultMessage="See full details"
                                            />
                                        </Link>
                                    )}
                                </HideOnMobile>
                            </>
                        ) : (
                            <ImageGallerySkeleton />
                        )}
                    </Box>

                    {/* Variations & Quantity Selector & CTA buttons */}
                    <VStack align="stretch" spacing={8} flex={1}>
                        <Box display={['none', 'none', 'none', 'block']}>
                            <ProductViewHeader
                                name={product?.name}
                                basePrice={basePrice}
                                discountPrice={discountPrice}
                                productType={product?.type}
                                currency={product?.currency}
                                category={category}
                                shortDescription={product?.shortDescription}
                            />
                        </Box>
                        <VStack align="stretch" spacing={4}>
                            {/*
                                Customize the skeletons shown for attributes to suit your needs. At the point
                                that we show the skeleton we do not know how many variations are selectable. So choose
                                a a skeleton that will meet most of your needs.
                            */}
                            {showLoading ? (
                                <>
                                    {/* First Attribute Skeleton */}
                                    <Skeleton height={6} width={32} />
                                    <Skeleton height={20} width={64} />

                                    {/* Second Attribute Skeleton */}
                                    <Skeleton height={6} width={32} />
                                    <Skeleton height={20} width={64} />
                                </>
                            ) : (
                                variationAttributes.map(({id, name, selectedValue, values}) => {
                                    const swatches = values.map(
                                        ({href, name, image, value, orderable}, index) => {
                                            const content = image ? (
                                                <Box
                                                    height="100%"
                                                    width="100%"
                                                    minWidth="32px"
                                                    backgroundRepeat="no-repeat"
                                                    backgroundSize="cover"
                                                    backgroundColor={name.toLowerCase()}
                                                    backgroundImage={`url(${
                                                        image.disBaseLink || image.link
                                                    })`}
                                                />
                                            ) : (
                                                name
                                            )
                                            const hasSelection = Boolean(selectedValue?.value)
                                            const isSelected = selectedValue?.value === value
                                            const isFirst = index === 0
                                            // To mimic the behavior of a native radio input, only
                                            // one swatch should receive tab focus; the rest can be
                                            // selected using arrow keys when the swatch group has
                                            // focus. The focused element is the selected option or
                                            // the first in the group, if no option is selected.
                                            // This is a slight difference, for simplicity, from the
                                            // native element, where the first element is focused on
                                            // `Tab` and the _last_ element is focused on `Shift+Tab`
                                            const isFocusable =
                                                isSelected || (!hasSelection && isFirst)
                                            return (
                                                <Swatch
                                                    key={value}
                                                    href={href}
                                                    disabled={!orderable}
                                                    value={value}
                                                    name={name}
                                                    variant={id === 'color' ? 'circle' : 'square'}
                                                    selected={isSelected}
                                                    isFocusable={isFocusable}
                                                >
                                                    {content}
                                                </Swatch>
                                            )
                                        }
                                    )
                                    return (
                                        <SwatchGroup
                                            key={id}
                                            value={selectedValue?.value}
                                            displayName={selectedValue?.name || ''}
                                            label={intl.formatMessage(
                                                {
                                                    defaultMessage: '{variantType}',
                                                    id: 'product_view.label.variant_type'
                                                },
                                                {variantType: name}
                                            )}
                                        >
                                            {swatches}
                                        </SwatchGroup>
                                    )
                                })
                            )}

                            {/* Quantity Selector */}
                            {!isProductASet && (
                                <VStack align="stretch" maxWidth={'200px'}>
                                    <Box fontWeight="bold">
                                        <label htmlFor="quantity">
                                            {intl.formatMessage({
                                                defaultMessage: 'Quantity:',
                                                id: 'product_view.label.quantity'
                                            })}
                                        </label>
                                    </Box>

                                    <QuantityPicker
                                        id="quantity"
                                        step={stepQuantity}
                                        value={quantity}
                                        min={minOrderQuantity}
                                        onChange={(stringValue, numberValue) => {
                                            // Set the Quantity of product to value of input if value number
                                            if (numberValue >= 0) {
                                                setQuantity(numberValue)
                                            } else if (stringValue === '') {
                                                // We want to allow the use to clear the input to start a new input so here we set the quantity to '' so NAN is not displayed
                                                // User will not be able to add '' qauntity to the cart due to the add to cart button enablement rules
                                                setQuantity(stringValue)
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Default to 1the `minOrderQuantity` if a user leaves the box with an invalid value
                                            const value = e.target.value
                                            if (parseInt(value) < 0 || value === '') {
                                                setQuantity(minOrderQuantity)
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // This is useful for mobile devices, this allows the user to pop open the keyboard and set the
                                            // new quantity with one click. NOTE: This is something that can be refactored into the parent
                                            // component, potentially as a prop called `selectInputOnFocus`.
                                            e.target.select()
                                        }}
                                    />
                                </VStack>
                            )}
                            <Box ref={errorContainerRef}>
                                {!showLoading && showOptionsMessage && (
                                    <Fade in={true}>
                                        <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                            {intl.formatMessage({
                                                defaultMessage:
                                                    'Please select all your options above'
                                            })}
                                        </Text>
                                    </Fade>
                                )}
                            </Box>
                            <HideOnDesktop>
                                {showFullLink && product && (
                                    <Link
                                        to={`/product/${product.master.masterId}`}
                                        color="blue.600"
                                    >
                                        <FormattedMessage
                                            id="product_view.link.full_details"
                                            defaultMessage="See full details"
                                        />
                                    </Link>
                                )}
                            </HideOnDesktop>
                            {isProductASet && <p>{product?.shortDescription}</p>}
                        </VStack>

                        <Box>
                            {!showLoading && showInventoryMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {inventoryMessage}
                                    </Text>
                                </Fade>
                            )}
                            <Box
                                display={
                                    isProductPartOfSet ? 'block' : ['none', 'none', 'none', 'block']
                                }
                            >
                                {renderActionButtons()}
                            </Box>
                        </Box>
                    </VStack>
                </Flex>
            </Flex>
        )
    }
)
ProductView.displayName = 'ProductView'
export default ProductView
