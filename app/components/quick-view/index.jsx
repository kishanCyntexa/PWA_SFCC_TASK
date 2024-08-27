
import React, {Fragment, useCallback, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {Box, Button, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    useProduct,
    useCategory,
    useShopperBasketsMutation,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'

// Hooks
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import ProductView from '@salesforce/retail-react-app/app/components/quick-view-modal'
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'

// constant
import {
    API_ERROR_MESSAGE,
    EINSTEIN_RECOMMENDERS,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import {rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'
import {useHistory, useLocation, useParams} from 'react-router-dom'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

const ProductDetail = (props) => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const activeData = useActiveData()
    const toast = useToast()
    const navigate = useNavigation()
    const [productSetSelection, setProductSetSelection] = useState({})
    const childProductRefs = React.useRef({})
    const customerId = useCustomerId()
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    
    const isBasketLoading = !basket?.basketId

    /*************************** Product Detail and Category ********************/
    const {productId} = props
    // const urlParams = new URLSearchParams(location.search)
    const {
        data: product,
        isLoading: isProductLoading,
        isError: isProductError,
        error: productError
    } = useProduct(
        {
            parameters: {
                id: productId,
                allImages: true
            }
        },
        {
            keepPreviousData: true
        }
    )
    const {
        data: category,
        isError: isCategoryError,
        error: categoryError
    } = useCategory({
        parameters: {
            id: product?.primaryCategoryId,
            level: 1
        }
    })

    /**************** Error Handling ****************/

    if (isProductError) {
        const errorStatus = productError?.response?.status
        switch (errorStatus) {
            case 404:
                throw new HTTPNotFound('Product Not Found.')
            default:
                throw new HTTPError(`HTTP Error ${errorStatus} occurred.`)
        }
    }
    if (isCategoryError) {
        const errorStatus = categoryError?.response?.status
        switch (errorStatus) {
            case 404:
                throw new HTTPNotFound('Category Not Found.')
            default:
                throw new HTTPError(`HTTP Error ${errorStatus} occurred.`)
        }
    }

    const isProductASet = product?.type.set

    const [primaryCategory, setPrimaryCategory] = useState(category)
    const variant = useVariant(product)
    useEffect(() => {
        if (category) {
            setPrimaryCategory(category)
        }
    }, [category])

    /**************** Product Variant ****************/
    useEffect(() => {
        if (!variant) {
            return
        }
        // update the variation attributes parameter on
        // the url accordingly as the variant changes
        const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
            pid: variant?.productId
        })
        history.replace(updatedUrl)
    }, [variant])

    /**************** Wishlist ****************/
    const {data: wishlist, isLoading: isWishlistLoading} = useWishList()
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )

   

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >

            <Stack spacing={16}>
                {isProductASet ? (
                    <Fragment>
                        {/* Product Set: parent product */}
                        <ProductView
                            product={product}
                            category={[]}
                            addToCart={handleProductSetAddToCart}
                            addToWishlist={handleAddToWishlist}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                            validateOrderability={handleProductSetValidation}
                        />

                        {
                            
                            product.setProducts.map((childProduct) => (
                                <Box key={childProduct.id} data-testid="child-product">
                                    <ProductView
                                        ref={function (ref) {
                                            childProductRefs.current[childProduct.id] = {
                                                ref,
                                                validateOrderability: this.validateOrderability
                                            }
                                        }}
                                        product={childProduct}
                                        isProductPartOfSet={true}
                                        addToCart={(variant, quantity) =>
                                            handleAddToCart([
                                                {product: childProduct, variant, quantity}
                                            ])
                                        }
                                        addToWishlist={handleAddToWishlist}
                                        onVariantSelected={(product, variant, quantity) => {
                                            if (quantity) {
                                                setProductSetSelection((previousState) => ({
                                                    ...previousState,
                                                    [product.id]: {
                                                        product,
                                                        variant,
                                                        quantity
                                                    }
                                                }))
                                            } else {
                                                const selections = {...productSetSelection}
                                                delete selections[product.id]
                                                setProductSetSelection(selections)
                                            }
                                        }}
                                        isProductLoading={isProductLoading}
                                        isBasketLoading={isBasketLoading}
                                        isWishlistLoading={isWishlistLoading}
                                    />

                                    <Box display={['none', 'none', 'none', 'block']}>
                                        <hr />
                                    </Box>
                                </Box>
                            ))
                        }
                    </Fragment>
                ) : (<Fragment></Fragment>)};

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    {!isProductASet && (
                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="Complete the Set"
                                    id="product_detail.recommended_products.title.complete_set"
                                />
                            }
                            recommender={EINSTEIN_RECOMMENDERS.PDP_COMPLETE_SET}
                            products={[product]}
                            mx={{base: -4, md: -8, lg: 0}}
                            shouldFetch={() => product?.id}
                        />
                    )}
                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="You might also like"
                                id="product_detail.recommended_products.title.might_also_like"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_MIGHT_ALSO_LIKE}
                        products={[product]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        // The Recently Viewed recommender doesn't use `products`, so instead we
                        // provide a key to update the recommendations on navigation.
                        key={location.key}
                        title={
                            <FormattedMessage
                                defaultMessage="Recently Viewed"
                                id="product_detail.recommended_products.title.recently_viewed"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_RECENTLY_VIEWED}
                        mx={{base: -4, md: -8, lg: 0}}
                    />
                </Stack>
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

ProductDetail.propTypes = {
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail
