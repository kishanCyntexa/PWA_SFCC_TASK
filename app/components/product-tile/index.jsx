import React, {useRef} from 'react'
import {useState} from "react";
import PropTypes from 'prop-types'
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'
import { useDisclosure, Button, Modal, ModalCloseButton, ModalContent, ModalOverlay, ModalBody} from '@chakra-ui/react'
import {
    AspectRatio,
    Box,
    Skeleton as ChakraSkeleton,
    Text,
    Stack,
    useMultiStyleConfig,
    IconButton
} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import QuickView from '../quick-view'
import {useIntl} from 'react-intl'
import {productUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import Link from '@salesforce/retail-react-app/app/components/link'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
const IconButtonWithRegistration = withRegistration(IconButton)
export const Skeleton = () => {
    const styles = useMultiStyleConfig('ProductTile')
    return (
        <Box data-testid="sf-product-tile-skeleton">
            <Stack spacing={2}>
                <Box {...styles.imageWrapper}>
                    <AspectRatio ratio={1} {...styles.image}>
                        <ChakraSkeleton />
                    </AspectRatio>
                </Box>
                <ChakraSkeleton width="80px" height="20px" />
                <ChakraSkeleton width={{base: '120px', md: '220px'}} height="12px" />
            </Stack>
        </Box>
    )
}
const ProductTile = (props) => {
    const intl = useIntl()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
        product,
        enableFavourite = false,
        isFavourite,
        onFavouriteToggle,
        dynamicImageProps,
        ...rest
    } = props
    const {currency, image, price, productId, hitType} = product
    const localizedProductName = product.name ?? product.productName

    const {currency: activeCurrency} = useCurrency()
    const isFavouriteLoading = useRef(false)
    const styles = useMultiStyleConfig('ProductTile')

    return (
        <Box {...styles.container}>
         <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
          <QuickView productId={productId}></QuickView>  
      </Modal>    
                <Box {...styles.imageWrapper} position="relative">
                <Link zIndex={1}
                data-testid="product-tile"
                to={productUrlBuilder({id: productId}, intl.local)}
            >{image && (
                        <AspectRatio {...styles.image}>
                            <DynamicImage 
                                src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                                widths={dynamicImageProps?.widths}
                                imageProps={{
                                    alt: image.alt,
                                    ...dynamicImageProps?.imageProps
                                }}     
                            />
                        </AspectRatio>  
                    )}
                    </Link>
                   <Button onClick={onOpen} >Quick View</Button>
                </Box>
                <Text>{localizedProductName}</Text>
                <Text data-testid="product-tile-price">
                    {hitType === 'set'
                        ? intl.formatMessage(
                              {
                                  id: 'product_tile.label.starting_at_price',
                                  defaultMessage: 'Starting at {price}'
                              },
                              {
                                  price: intl.formatNumber(price, {
                                      style: 'currency',
                                      currency: currency || activeCurrency
                                  })
                              }
                          )
                        : intl.formatNumber(price, {
                              style: 'currency',
                              currency: currency || activeCurrency
                          })}
                </Text>
            {enableFavourite && (
                <Box
                    onClick={(e) => {
                        e.preventDefault()
                    }}
                >
                    <IconButtonWithRegistration
                        data-testid="wishlist-button"
                        aria-label={
                            isFavourite
                                ? intl.formatMessage(
                                      {
                                          id: 'product_tile.assistive_msg.remove_from_wishlist',
                                          defaultMessage: 'Remove {product} from wishlist'
                                      },
                                      {product: localizedProductName}
                                  )
                                : intl.formatMessage(
                                      {
                                          id: 'product_tile.assistive_msg.add_to_wishlist',
                                          defaultMessage: 'Add {product} to wishlist'
                                      },
                                      {product: localizedProductName}
                                  )
                        }
                        icon={isFavourite ? <HeartSolidIcon /> : <HeartIcon />}
                        {...styles.favIcon}
                        onClick={async () => {
                            if (!isFavouriteLoading.current) {
                                isFavouriteLoading.current = true
                                await onFavouriteToggle(!isFavourite)
                                isFavouriteLoading.current = false
                            }
                        }}
                    />
                </Box>
            )}
        </Box>
    )
}
ProductTile.displayName = 'ProductTile'
ProductTile.propTypes = {
    product: PropTypes.shape({
        currency: PropTypes.string,
        image: PropTypes.shape({
            alt: PropTypes.string,
            disBaseLink: PropTypes.string,
            link: PropTypes.string
        }),
        price: PropTypes.number,
        productName: PropTypes.string,
        productId: PropTypes.string,
        hitType: PropTypes.string
    })
    onFavouriteToggle: PropTypes.func,
    dynamicImageProps: PropTypes.object
}

export default ProductTile
